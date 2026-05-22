"use client";

import { useState, useEffect } from "react";
import { Power, RefreshCw, AlertCircle, Save } from "lucide-react";

interface Setup {
  id: string;
  name: string;
  display_name: string;
  badge: string;
  description: string;
  base_price: number;
  is_active: boolean;
  sort_order: number;
}

export default function SetupManagement() {
  const [setups, setSetups] = useState<Setup[]>([]);
  const [originalSetups, setOriginalSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const response = await fetch('/api/admin/setups');
    const data = await response.json();

    if (data.setups) {
      setSetups(data.setups);
      setOriginalSetups(JSON.parse(JSON.stringify(data.setups)));
      setHasChanges(false);
    }

    setLoading(false);
  };

  const toggleSetupStatus = (setupId: string) => {
    setSetups(setups.map(s =>
      s.id === setupId ? { ...s, is_active: !s.is_active } : s
    ));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setSaving(true);

    // Find which setups changed
    const changedSetups = setups.filter(setup => {
      const original = originalSetups.find(s => s.id === setup.id);
      return original && original.is_active !== setup.is_active;
    });

    if (changedSetups.length === 0) {
      setMessage({ type: 'error', text: 'No changes to save' });
      setSaving(false);
      return;
    }

    try {
      // Save each changed setup
      for (const setup of changedSetups) {
        const response = await fetch('/api/admin/setups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setupId: setup.id,
            isActive: setup.is_active,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to update ${setup.display_name}`);
        }
      }

      // Update original state to reflect saved values
      setOriginalSetups(JSON.parse(JSON.stringify(setups)));
      setHasChanges(false);
      setMessage({ type: 'success', text: 'All changes saved successfully!' });
      setTimeout(() => setMessage(null), 3000);

    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    setSetups(JSON.parse(JSON.stringify(originalSetups)));
    setHasChanges(false);
    setMessage({ type: 'success', text: 'Changes cancelled' });
    setTimeout(() => setMessage(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff5200]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-brand text-4xl uppercase text-white">Setup Management</h1>
          <p className="text-[#A0A6AF] text-sm mt-1">Enable/disable gaming setups and manage All-Access Pass</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200] transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-500'
            : 'bg-red-500/10 border border-red-500/30 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-white">You have unsaved changes</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={cancelChanges}
              className="px-4 py-2 rounded-lg border border-[#2A2F38] text-[#A0A6AF] hover:border-yellow-500 hover:text-yellow-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#ff5200] text-white hover:bg-[#cc2200] transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Setups List */}
      <div className="bg-[#0A0F18] border border-[rgba(255,82,0,0.16)] rounded-2xl p-6">
        <h2 className="font-accent-bold text-white mb-4 flex items-center gap-2">
          <Power className="w-5 h-5 text-[#ff5200]" />
          Gaming Setups
        </h2>

        <div className="space-y-3">
          {setups.map((setup) => {
            const isChanged = originalSetups.find(s => s.id === setup.id)?.is_active !== setup.is_active;

            return (
              <div
                key={setup.id}
                className={`flex items-center justify-between p-4 rounded-xl transition ${
                  !setup.is_active ? 'bg-red-500/5 border border-red-500/20' : 'bg-[#050508]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{setup.display_name}</h3>
                    {!setup.is_active && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-500">
                        Disabled
                      </span>
                    )}
                    {isChanged && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-500">
                        Changed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#A0A6AF] mt-1 line-clamp-1">{setup.description}</p>
                </div>
                <button
                  onClick={() => toggleSetupStatus(setup.id)}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    setup.is_active
                      ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {setup.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#A0A6AF] mt-4">
          💡 Disabled setups will not appear in the booking wizard
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-[#0A0F18] border border-[rgba(255,82,0,0.16)] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">Setup Availability</h3>
        <p className="text-sm text-[#A0A6AF]">
          Use the <span className="text-[#ff5200]">Price Settings</span> page to edit All-Access pricing and H Coins values.
        </p>
      </div>
    </div>
  );
}
