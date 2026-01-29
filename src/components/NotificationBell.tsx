import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trophy, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useNotifications, Notification } from '../hooks/useNotifications';

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_participant':
        return <Users className="size-4 text-blue-500" />;
      case 'match_result':
        return <Trophy className="size-4 text-[#E85D24]" />;
      case 'rank_change':
        return <TrendingUp className="size-4 text-green-500" />;
      case 'exact_match':
        return <CheckCheck className="size-4 text-green-600" />;
      default:
        return <AlertCircle className="size-4 text-[#999]" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botón campana */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-[#f5f5f5] transition-colors"
        title="Notificaciones"
      >
        <Bell className="size-5 text-[#666]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#eee] rounded-xl shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eee]">
            <h3 className="font-semibold text-[#1a1a1a]">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#E85D24] hover:underline flex items-center gap-1"
              >
                <Check className="size-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-[#999]">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="size-10 text-[#e5e5e5] mx-auto mb-2" />
                <p className="text-[#999] text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f5f5f5]">
                {notifications.slice(0, 20).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-[#fafafa] cursor-pointer transition-colors ${
                      !notification.read ? 'bg-[#FFF8F5]' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-[#1a1a1a]' : 'text-[#666]'}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-[#999] flex-shrink-0">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-[#999] mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="size-2 bg-[#E85D24] rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[#eee] text-center">
              <span className="text-xs text-[#999]">
                Últimas {Math.min(notifications.length, 20)} notificaciones
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}