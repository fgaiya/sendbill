'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { ChevronDown, Plus } from 'lucide-react';

export interface Client {
  id: string;
  name: string;
  contactName?: string;
}

export interface ClientSelectorProps {
  value?: string;
  onChange: (client: { id: string; name: string } | null) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

export function ClientSelector({
  value,
  onChange,
  disabled = false,
  placeholder = '取引先を選択',
  id,
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // 取引先一覧を取得
  useEffect(() => {
    let isMounted = true;

    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(undefined);

        // デフォルトのクエリパラメータでAPI呼び出し
        const params = new URLSearchParams({
          page: '1',
          limit: '100', // セレクター用なので多めに取得
          sort: 'name_asc',
        });
        const response = await fetch(`/api/clients?${params}`);

        if (!response.ok) {
          throw new Error('取引先の取得に失敗しました');
        }

        const data = await response.json();
        if (isMounted) {
          setClients(data.data || []);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '取引先の取得に失敗しました';
        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchClients();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedClient = clients.find((client) => client.id === value);

  const handleClientSelect = (client: Client) => {
    onChange({ id: client.id, name: client.name });
    setIsOpen(false);
  };

  const handleNewClient = () => {
    router.push('/dashboard/clients/new');
  };

  if (loading) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
        取引先を読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="取引先を選択"
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
      >
        <span className="block truncate">
          {selectedClient ? (
            <span>
              {selectedClient.name}
              {selectedClient.contactName && (
                <span className="text-gray-500 ml-2">
                  ({selectedClient.contactName})
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
          role="listbox"
          aria-label="取引先一覧"
        >
          {clients.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              取引先が登録されていません
            </div>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleClientSelect(client)}
                role="option"
                aria-selected={client.id === value}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  client.id === value ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <div className="block truncate">
                  {client.name}
                  {client.contactName && (
                    <span className="text-gray-500 ml-2">
                      ({client.contactName})
                    </span>
                  )}
                </div>
              </button>
            ))
          )}

          {/* 新規取引先作成ボタン */}
          <div className="border-t border-gray-200 mt-1">
            <button
              type="button"
              onClick={handleNewClient}
              className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              新しい取引先を作成
            </button>
          </div>
        </div>
      )}

      {/* オーバーレイ（ドロップダウンを閉じるため） */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
