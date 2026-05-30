"use client";

import { useState, useEffect } from "react";
import { Power, RefreshCw, CheckCircle, XCircle, Loader2, Timer } from "lucide-react";

interface AllAccessSetting {
  id: string;
  duration_minutes: number;
  price: number;
  h_coins_earned: number;
  is_active: boolean;
}

type MessageState = { type: "success" | "error"; text: string } | null;

export default function SetupManagement() {
  const [allAccessSettings, setAllAccessSettings] = useState<AllAccessSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const timestamp = Date.now();

      const allAccessResponse = await fetch(`/api/admin/all-access?_=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const allAccessData = await allAccessResponse.json();

      if (!allAccessResponse.ok) {
        throw new Error(allAccessData?.error || 'Failed to load all-access settings');
      }

      setAllAccessSettings(allAccessData.settings || []);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to load data';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 3000);
  };

  const toggleAllAccessStatus = async (durationMinutes: number, currentStatus: boolean) => {
    setTogglingId(`access-${durationMinutes}`);

    try {
      const response = await fetch('/api/admin/all-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes, isActive: !currentStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setAllAccessSettings((prev) =>
          prev.map((setting) =>
            setting.duration_minutes === durationMinutes ? { ...setting, is_active: !currentStatus } : setting
          )
        );
        showMessage('success', `All-Access ${durationMinutes === 30 ? '30min' : '1hr'} ${!currentStatus ? 'disabled' : 'enabled'} successfully`);
      } else {
        showMessage('error', data.error || 'Failed to update status');
      }
    } catch {
      showMessage('error', 'Network error. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff5200]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-orbitron text-4xl uppercase text-white" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>All-Access Pass</h1>
          <p className="font-sans text-[#A0A6AF] text-sm mt-1">Manage All-Access pass availability and pricing</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050508] border border-[#1A1F28] font-sans text-[#A0A6AF] hover:border-[#ff5200] transition-all duration-300"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 font-sans ${
          message.type === 'success'
            ? 'bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22C55E]'
            : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#EF4444]'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-[#0A0F18] border border-[rgba(255,82,0,0.2)] rounded-2xl p-6" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(255,82,0,0.05)' }}>
        <h2 className="font-sans font-bold text-white mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5 text-[#ff5200]" />
          All-Access Pass
        </h2>

        <div className="space-y-4">
          {allAccessSettings.map((setting) => (
            <div
              key={setting.id}
              className={`rounded-xl p-5 transition-all duration-300 ${setting.is_active ? 'bg-[#050508] border border-[#1A1F28]' : 'border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]'}`}
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-orbitron font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>
                    {setting.duration_minutes === 30 ? '30 Minutes Pass' : '1 Hour Pass'}
                  </h3>
                  <p className="mt-1 text-sm font-sans text-[#A0A6AF]">
                    Access any setup for {setting.duration_minutes === 30 ? '30 minutes' : '1 hour'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="price-text text-2xl">₹{setting.price}</div>
                  <div className="text-xs font-sans text-[#22C55E]">+{setting.h_coins_earned} H Coins</div>
                </div>
              </div>

              <div className="rounded-lg bg-[#0A0F18] p-3 text-xs font-sans text-[#A0A6AF]">
                🎮 Use any available setup (PS5, PS4, Arcade, Racing, PC)
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-sans font-semibold ${setting.is_active ? 'bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22C55E]' : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#EF4444]'}`}>
                  {setting.is_active ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAllAccessStatus(setting.duration_minutes, setting.is_active)}
                  disabled={togglingId === `access-${setting.duration_minutes}`}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-sans font-semibold transition-all duration-300 ${
                    setting.is_active
                      ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)]'
                      : 'bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.2)]'
                  } disabled:opacity-50`}
                >
                  {togglingId === `access-${setting.duration_minutes}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                  {setting.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs font-sans text-[#A0A6AF]">
          💡 All-Access passes let you switch between any available setup freely
        </p>
      </div>


    </div>
  );
}
