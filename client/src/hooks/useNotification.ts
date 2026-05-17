export default function useNotification() {
  async function requestPermission() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  async function notify(title: string, body: string) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await requestPermission();
    }
    if (Notification.permission !== "granted") return;
    new Notification(title, { body });
  }

  return { requestPermission, notify };
}
