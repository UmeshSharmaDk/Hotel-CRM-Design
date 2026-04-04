module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      // Removed the react-compiler plugin to let Expo handle it natively
      "react-native-reanimated/plugin",
    ],
  };
};