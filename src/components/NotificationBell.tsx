import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, type AppNotification } from '../services/notificationService';

export default function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AppNotification | null>(null);

  useEffect(() => { void getNotifications().then(setItems).catch(() => undefined); }, []);

  const unread = items.filter((item) => !item.readAt).length;
  async function read(item: AppNotification) {
    if (!item.readAt) {
      await markNotificationRead(item.id);
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry));
    }
  }
  async function openDetail(item: AppNotification) {
    await read(item);
    setSelected(item);
  }

  return <div className="notification-bell">
    <button type="button" aria-label={`알림 ${unread}개`} onClick={() => setOpen((current) => !current)}>🔔{unread > 0 && <span>{unread}</span>}</button>
    {open && <div className="notification-popover"><strong>알림</strong>{items.length === 0 ? <p>새 알림이 없습니다.</p> : items.slice(0, 10).map((item) => <button className={item.readAt ? '' : 'is-unread'} key={item.id} type="button" onClick={() => void read(item)} onDoubleClick={() => void openDetail(item)}><b>{item.title}</b><span>{item.message}</span></button>)}</div>}
    {selected && <div className="notification-detail-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="notification-detail" role="dialog" aria-modal="true" aria-label="알림 상세" onMouseDown={(event) => event.stopPropagation()}><button className="notification-detail-close" type="button" aria-label="닫기" onClick={() => setSelected(null)}>×</button><p>피드백 알림</p><h2>{selected.title}</h2><div>{selected.message}</div><time dateTime={selected.createdAt}>{new Date(selected.createdAt).toLocaleString('ko-KR')}</time></section></div>}
  </div>;
}
