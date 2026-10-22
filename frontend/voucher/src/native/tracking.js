import { Capacitor, registerPlugin } from "@capacitor/core";

// تتبع الموقع: في تطبيق الأندرويد بيشتغل في الخلفية (Foreground Service)،
// وفي المتصفح العادي بيشتغل والصفحة مفتوحة بس.
export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// onPos({lat,lng,accuracy,t}) — onState("ok" | "waiting" | "denied" | "unsupported")
// بترجّع دالة إيقاف
export function startLocationWatch({ onPos, onState }) {
  if (isNativeApp()) return startNative({ onPos, onState });
  return startWeb({ onPos, onState });
}

function startWeb({ onPos, onState }) {
  if (!navigator.geolocation) {
    onState("unsupported");
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (p) => {
      onState("ok");
      onPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, t: Date.now() });
    },
    (e) => onState(e.code === 1 ? "denied" : "waiting"),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

function startNative({ onPos, onState }) {
  const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");
  let watcherId = null;
  let stopped = false;

  (async () => {
    // أندرويد 13+: لازم إذن الإشعارات عشان إشعار "التتبع شغال" يظهر
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.requestPermissions();
    } catch {
      /* مش مشكلة لو اترفض */
    }
    try {
      const id = await BackgroundGeolocation.addWatcher(
        {
          backgroundTitle: "VE Voucher - الدليفري",
          backgroundMessage: "بنتابع موقعك أثناء الشغل. اقفل التطبيق من هنا لما تخلص.",
          requestPermissions: true,
          stale: false,
          distanceFilter: 10,
        },
        (location, error) => {
          if (error) {
            if (error.code === "NOT_AUTHORIZED") {
              onState("denied");
              if (window.confirm("لازم تسمح للتطبيق بالموقع (طول الوقت) عشان تشتغل دليفري. تفتح الإعدادات؟")) {
                BackgroundGeolocation.openSettings();
              }
            } else onState("waiting");
            return;
          }
          if (!location) return;
          onState("ok");
          onPos({
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
            t: location.time || Date.now(),
          });
        }
      );
      if (stopped) BackgroundGeolocation.removeWatcher({ id });
      else watcherId = id;
    } catch {
      onState("waiting");
    }
  })();

  return () => {
    stopped = true;
    if (watcherId !== null) BackgroundGeolocation.removeWatcher({ id: watcherId });
  };
}
