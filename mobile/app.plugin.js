// Expo Config Plugin — persists CallTrack native customizations across expo prebuild runs
const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');

const withCallTrackNative = (config) => {
  // ── AndroidManifest: permissions + PhoneStateReceiver ─────────────────
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Permissions
    if (!manifest['uses-permission']) manifest['uses-permission'] = [];
    const perms = manifest['uses-permission'];
    const addPerm = (name) => {
      if (!perms.find((p) => p.$?.['android:name'] === name))
        perms.push({ $: { 'android:name': name } });
    };
    addPerm('android.permission.READ_PHONE_STATE');
    addPerm('android.permission.READ_PHONE_NUMBERS');
    addPerm('android.permission.POST_NOTIFICATIONS');

    // PhoneStateReceiver
    const app = manifest.application[0];
    if (!app.receiver) app.receiver = [];
    if (!app.receiver.find((r) => r.$?.['android:name'] === '.PhoneStateReceiver')) {
      app.receiver.push({
        $: { 'android:name': '.PhoneStateReceiver', 'android:exported': 'true' },
        'intent-filter': [{
          action: [{ $: { 'android:name': 'android.intent.action.PHONE_STATE' } }]
        }],
      });
    }

    return cfg;
  });

  // ── MainApplication: register CallLogPackage + SimInfoPackage ─────────
  config = withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes('CallLogPackage()')) {
      src = src.replace(
        'val packages = PackageList(this).packages',
        'val packages = PackageList(this).packages\n            packages.add(CallLogPackage())\n            packages.add(SimInfoPackage())'
      );
      cfg.modResults.contents = src;
    }
    return cfg;
  });

  return config;
};

module.exports = withCallTrackNative;
