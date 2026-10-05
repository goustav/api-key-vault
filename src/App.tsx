import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type Provider, type ApiKey, type ProviderWithKeys } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { detectProviderPreset, pingApiKey, type PingResult } from '@/lib/ping';
import { exportVault, parseCSV, parseJSON, type ExportFormat, type ImportedData } from '@/lib/exportImport';

import GoogleSignIn from '@/components/GoogleSignIn';
import WelcomeModal from '@/components/WelcomeModal';
import Header from '@/components/Header';
import ProviderCard from '@/components/ProviderCard';
import ProviderModal from '@/components/ProviderModal';
import KeyModal from '@/components/KeyModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import ToastContainer from '@/components/Toast';
import TrashModal from '@/components/TrashModal';
import CodeSnippetModal from '@/components/CodeSnippetModal';
import DuplicateWarningModal from '@/components/DuplicateWarningModal';
import ImportModal from '@/components/ImportModal';
import { KeyRound, Plus, Lock } from 'lucide-react';

export default function App() {
  const { user, profile, loading, needsUsername, signInWithGoogle, signOut, saveUsername } =
    useAuth();

  const [locked, setLocked] = useState(false);
  const [providers, setProviders] = useState<ProviderWithKeys[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [keyModalProviderId, setKeyModalProviderId] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeKey, setCodeKey] = useState<{ key: string; provider: string } | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Duplicate warning
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateProvider, setDuplicateProvider] = useState<string | null>(null);
  const pendingKeySave = useRef<{
    providerId: string;
    accountLabel: string;
    note: string;
    keyValue: string;
    isEdit: boolean;
    editId: string | null;
  } | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Ping results
  const [pingResults, setPingResults] = useState<Record<string, PingResult | 'loading'>>({});

  const { toasts, showToast, dismissToast } = useToast();

  // ===== Data Fetching =====
  const fetchProviders = useCallback(async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*, api_keys(*)')
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Failed to load providers', 'error');
      return;
    }
    setProviders((data as ProviderWithKeys[]) ?? []);
    setDataLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (!user || locked) return;
    fetchProviders();

    const providerChannel = supabase
      .channel('providers-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => {
        fetchProviders();
      })
      .subscribe();

    const keysChannel = supabase
      .channel('api-keys-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_keys' }, () => {
        fetchProviders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(providerChannel);
      supabase.removeChannel(keysChannel);
    };
  }, [user, locked, fetchProviders]);

  // ===== Helpers =====
  const getAllActiveKeys = useCallback((): Array<{ key: ApiKey; providerName: string }> => {
    return providers.flatMap((p) =>
      p.api_keys
        .filter((k) => !k.is_deleted)
        .map((k) => ({ key: k, providerName: p.name }))
    );
  }, [providers]);

  // ===== Provider CRUD =====
  const handleSaveProvider = async (name: string, dashboardUrl: string) => {
    if (editingProvider) {
      const { error } = await supabase
        .from('providers')
        .update({ name, dashboard_url: dashboardUrl || null })
        .eq('id', editingProvider.id);
      if (error) {
        showToast('Failed to update provider', 'error');
        return;
      }
      showToast('Provider updated');
    } else {
      const { error } = await supabase
        .from('providers')
        .insert({ name, dashboard_url: dashboardUrl || null });
      if (error) {
        showToast('Failed to add provider', 'error');
        return;
      }
      showToast('Provider added');
    }
    setProviderModalOpen(false);
    setEditingProvider(null);
    fetchProviders();
  };

  const handleSoftDeleteProvider = (provider: ProviderWithKeys) => {
    setConfirmTitle('Move to Trash');
    setConfirmMessage(
      `"${provider.name}" and its keys will be moved to Trash. You can restore them later.`
    );
    setConfirmAction(() => async () => {
      const { error } = await supabase
        .from('providers')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', provider.id);
      if (error) {
        showToast('Failed to delete provider', 'error');
        return;
      }
      showToast('Moved to trash');
      setConfirmOpen(false);
      fetchProviders();
    });
    setConfirmOpen(true);
  };

  const handleTogglePin = async (provider: ProviderWithKeys) => {
    const { error } = await supabase
      .from('providers')
      .update({ is_pinned: !provider.is_pinned })
      .eq('id', provider.id);
    if (error) {
      showToast('Failed to update pin', 'error');
      return;
    }
    fetchProviders();
  };

  // ===== Key CRUD =====
  const checkDuplicate = useCallback(
    (keyValue: string, excludeKeyId?: string): string | null => {
      const allKeys = getAllActiveKeys();
      const found = allKeys.find(
        ({ key }) => key.key_value === keyValue && key.id !== excludeKeyId
      );
      return found ? found.providerName : null;
    },
    [getAllActiveKeys]
  );

  const handleSaveKey = async (
    providerId: string,
    accountLabel: string,
    note: string,
    keyValue: string,
    isEdit: boolean,
    editId: string | null,
    force: boolean
  ) => {
    if (!force) {
      const existingProvider = checkDuplicate(keyValue, isEdit ? editId ?? undefined : undefined);
      if (existingProvider !== null) {
        pendingKeySave.current = { providerId, accountLabel, note, keyValue, isEdit, editId };
        setDuplicateProvider(existingProvider);
        setDuplicateOpen(true);
        return;
      }
    }

    if (isEdit && editId) {
      const { error } = await supabase
        .from('api_keys')
        .update({ account_label: accountLabel, note: note || null, key_value: keyValue })
        .eq('id', editId);
      if (error) {
        showToast('Failed to update key', 'error');
        return;
      }
      showToast('Key updated');
    } else {
      const { error } = await supabase.from('api_keys').insert({
        provider_id: providerId,
        account_label: accountLabel,
        note: note || null,
        key_value: keyValue,
      });
      if (error) {
        showToast('Failed to add key', 'error');
        return;
      }
      showToast('Key added');
    }
    setKeyModalOpen(false);
    setEditingKey(null);
    setKeyModalProviderId(null);
    pendingKeySave.current = null;
    fetchProviders();
  };

  const handleSoftDeleteKey = (providerId: string, keyId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    const keyData = provider?.api_keys.find((k) => k.id === keyId);
    setConfirmTitle('Move to Trash');
    setConfirmMessage(
      `Key "${keyData?.account_label ?? 'this key'}" will be moved to Trash. You can restore it later.`
    );
    setConfirmAction(() => async () => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', keyId);
      if (error) {
        showToast('Failed to delete key', 'error');
        return;
      }
      showToast('Moved to trash');
      setConfirmOpen(false);
      fetchProviders();
    });
    setConfirmOpen(true);
  };

  const handleCopyKey = async (keyId: string, keyValue: string) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      showToast('Copied to clipboard');
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyId);
      fetchProviders();
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  // ===== Ping =====
  const handlePingKey = async (key: ApiKey) => {
    const provider = providers.find((p) => p.id === key.provider_id);
    if (!provider) return;

    const preset = detectProviderPreset(provider.name);
    if (!preset) {
      showToast(`No ping preset for "${provider.name}". Supported: OpenAI, OpenRouter, Anthropic, Groq, Together, Mistral`, 'info');
      return;
    }

    setPingResults((prev) => ({ ...prev, [key.id]: 'loading' }));
    const result = await pingApiKey(key.key_value, preset);
    setPingResults((prev) => ({ ...prev, [key.id]: result }));

    if (result.status === 'ok') {
      showToast(`Ping OK: ${result.statusCode} — Key is active`);
    } else if (result.status === 'invalid') {
      showToast(`Ping failed: ${result.statusCode} — ${result.message}`, 'error');
    } else {
      showToast(`Ping: ${result.message}`, 'info');
    }
  };

  // ===== Trash Actions =====
  const handleRestoreProvider = async (id: string) => {
    const { error } = await supabase
      .from('providers')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);
    if (error) {
      showToast('Failed to restore', 'error');
      return;
    }
    showToast('Provider restored');
    fetchProviders();
  };

  const handleDeleteForeverProvider = (id: string) => {
    const provider = providers.find((p) => p.id === id);
    setConfirmTitle('Delete Forever');
    setConfirmMessage(
      `Permanently delete "${provider?.name}"? This cannot be undone.`
    );
    setConfirmAction(() => async () => {
      const { error } = await supabase.from('providers').delete().eq('id', id);
      if (error) {
        showToast('Failed to delete', 'error');
        return;
      }
      showToast('Permanently deleted');
      setConfirmOpen(false);
      fetchProviders();
    });
    setConfirmOpen(true);
  };

  const handleRestoreKey = async (providerId: string, keyId: string) => {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', keyId);
    if (error) {
      showToast('Failed to restore', 'error');
      return;
    }
    showToast('Key restored');
    fetchProviders();
  };

  const handleDeleteForeverKey = (providerId: string, keyId: string) => {
    setConfirmTitle('Delete Forever');
    setConfirmMessage('Permanently delete this key? This cannot be undone.');
    setConfirmAction(() => async () => {
      const { error } = await supabase.from('api_keys').delete().eq('id', keyId);
      if (error) {
        showToast('Failed to delete', 'error');
        return;
      }
      showToast('Permanently deleted');
      setConfirmOpen(false);
      fetchProviders();
    });
    setConfirmOpen(true);
  };

  const handleEmptyTrash = () => {
    const trashedProviderIds = providers.filter((p) => p.is_deleted).map((p) => p.id);
    const trashedKeyIds = providers.flatMap((p) =>
      p.api_keys.filter((k) => k.is_deleted).map((k) => k.id)
    );

    setConfirmAction(() => async () => {
      if (trashedKeyIds.length > 0) {
        await supabase.from('api_keys').delete().in('id', trashedKeyIds);
      }
      if (trashedProviderIds.length > 0) {
        await supabase.from('providers').delete().in('id', trashedProviderIds);
      }
      showToast('Trash emptied');
      fetchProviders();
    });
    setConfirmTitle('Empty Trash');
    setConfirmMessage('Permanently delete all trashed items? This cannot be undone.');
    setConfirmOpen(true);
  };

  // ===== Export / Import =====
  const handleExport = (format: ExportFormat) => {
    const activeProviders = providers.filter((p) => !p.is_deleted);
    if (activeProviders.length === 0) {
      showToast('Nothing to export', 'info');
      return;
    }
    exportVault(activeProviders, format);
    showToast(`Exported as ${format.toUpperCase()}`);
  };

  const handleImport = async (data: ImportedData) => {
    let providerCount = 0;
    let keyCount = 0;

    for (const p of data.providers) {
      const { data: newProvider, error } = await supabase
        .from('providers')
        .insert({
          name: p.name,
          dashboard_url: p.dashboard_url || null,
        })
        .select('id')
        .maybeSingle();

      if (error || !newProvider) continue;
      providerCount++;

      if (p.api_keys && p.api_keys.length > 0) {
        const keysToInsert = p.api_keys.map((k) => ({
          provider_id: newProvider.id,
          account_label: k.account_label,
          note: k.note || null,
          key_value: k.key_value,
        }));
        const { error: keyError } = await supabase.from('api_keys').insert(keysToInsert);
        if (!keyError) keyCount += keysToInsert.length;
      }
    }

    showToast(`Imported ${providerCount} providers, ${keyCount} keys`);
    fetchProviders();
  };

  // ===== Modal Openers =====
  const openAddProvider = () => {
    setEditingProvider(null);
    setProviderModalOpen(true);
  };
  const openEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setProviderModalOpen(true);
  };
  const openAddKey = (providerId: string) => {
    setEditingKey(null);
    setKeyModalProviderId(providerId);
    setKeyModalOpen(true);
  };
  const openEditKey = (providerId: string, keyId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    const keyData = provider?.api_keys.find((k) => k.id === keyId);
    if (!keyData) return;
    setEditingKey(keyData);
    setKeyModalProviderId(providerId);
    setKeyModalOpen(true);
  };

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
  };

  // ===== Derived =====
  const trashCount =
    providers.filter((p) => p.is_deleted).length +
    providers.flatMap((p) => p.api_keys.filter((k) => k.is_deleted)).length;

  const filteredProviders = search.trim()
    ? providers.filter(
        (p) =>
          !p.is_deleted &&
          p.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : providers.filter((p) => !p.is_deleted);

  // Sort: pinned first, then by created_at desc
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const keyModalProviderName =
    providers.find((p) => p.id === keyModalProviderId)?.name ?? '';

  // ===== Render =====
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-400" />
      </div>
    );
  }

  if (!user) {
    return <GoogleSignIn onSignIn={signInWithGoogle} />;
  }

  if (needsUsername) {
    return (
      <WelcomeModal
        open={needsUsername}
        googleName={user.name}
        onSave={saveUsername}
      />
    );
  }

  if (locked) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="flex w-full max-w-sm flex-col items-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 ring-1 ring-white/10">
            <Lock className="h-9 w-9 text-sky-400" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Vault Locked</h1>
          <p className="mb-8 text-sm text-zinc-500">Welcome back, {profile?.username}. Tap to unlock.</p>
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={profile?.username ?? ''}
              className="mb-6 h-16 w-16 rounded-2xl object-cover ring-2 ring-white/10"
              referrerPolicy="no-referrer"
            />
          )}
          <button
            onClick={() => setLocked(false)}
            className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-sky-400 active:scale-[0.98]"
          >
            Unlock Vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950">
      <Header
        search={search}
        onSearchChange={setSearch}
        onAddProvider={openAddProvider}
        onLock={() => setLocked(true)}
        onSignOut={signOut}
        onOpenTrash={() => setTrashOpen(true)}
        onExport={handleExport}
        onImport={() => setImportOpen(true)}
        trashCount={trashCount}
        username={profile?.username ?? user.name ?? 'User'}
        avatarUrl={user.avatarUrl}
      />

      <main className="mx-auto max-w-4xl px-3 py-5 sm:px-6 sm:py-8">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-400" />
            <p className="mt-4 text-sm text-zinc-500">Loading your vault...</p>
          </div>
        ) : sortedProviders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center sm:py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/15 to-emerald-500/10 ring-1 ring-white/10">
              <KeyRound className="h-8 w-8 text-sky-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {search ? 'No providers found' : 'Your vault is empty'}
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-zinc-500">
              {search
                ? `No providers match "${search}". Try a different search.`
                : 'Add your first API provider to start storing keys securely.'}
            </p>
            {!search && (
              <button
                onClick={openAddProvider}
                className="mt-6 flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-400 active:scale-95"
              >
                <Plus className="h-4.5 w-4.5" />
                Add Provider
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onEditProvider={() => openEditProvider(provider)}
                onSoftDeleteProvider={() => handleSoftDeleteProvider(provider)}
                onTogglePin={() => handleTogglePin(provider)}
                onAddKey={() => openAddKey(provider.id)}
                onEditKey={(keyId) => openEditKey(provider.id, keyId)}
                onSoftDeleteKey={(keyId) => handleSoftDeleteKey(provider.id, keyId)}
                onCopyKey={handleCopyKey}
                onPingKey={handlePingKey}
                onShowCode={(key) => {
                  setCodeKey({ key: key.key_value, provider: provider.name });
                  setCodeModalOpen(true);
                }}
                pingResults={pingResults}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <ProviderModal
        open={providerModalOpen}
        provider={editingProvider}
        onSave={handleSaveProvider}
        onClose={() => {
          setProviderModalOpen(false);
          setEditingProvider(null);
        }}
      />

      <KeyModal
        open={keyModalOpen}
        keyData={editingKey}
        providerName={keyModalProviderName}
        onSave={async (accountLabel, note, keyValue) => {
          await handleSaveKey(
            keyModalProviderId!,
            accountLabel,
            note,
            keyValue,
            !!editingKey,
            editingKey?.id ?? null,
            false
          );
        }}
        onClose={() => {
          setKeyModalOpen(false);
          setEditingKey(null);
          setKeyModalProviderId(null);
        }}
      />

      <TrashModal
        open={trashOpen}
        providers={providers}
        onRestoreProvider={handleRestoreProvider}
        onDeleteForeverProvider={handleDeleteForeverProvider}
        onRestoreKey={handleRestoreKey}
        onDeleteForeverKey={handleDeleteForeverKey}
        onEmptyTrash={handleEmptyTrash}
        onClose={() => setTrashOpen(false)}
      />

      <CodeSnippetModal
        open={codeModalOpen}
        apiKey={codeKey?.key ?? ''}
        providerName={codeKey?.provider ?? ''}
        onClose={() => {
          setCodeModalOpen(false);
          setCodeKey(null);
        }}
      />

      <ImportModal
        open={importOpen}
        onImport={handleImport}
        onClose={() => setImportOpen(false)}
      />

      <DuplicateWarningModal
        open={duplicateOpen}
        existingProvider={duplicateProvider}
        onCancel={() => {
          setDuplicateOpen(false);
          pendingKeySave.current = null;
        }}
        onForceSave={() => {
          const pending = pendingKeySave.current;
          if (!pending) return;
          setDuplicateOpen(false);
          handleSaveKey(
            pending.providerId,
            pending.accountLabel,
            pending.note,
            pending.keyValue,
            pending.isEdit,
            pending.editId,
            true
          );
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
