window.customIconsets = window.customIconsets || {};
window.customIconsets["elevenlabs"] = async function (name) {
  const icons = {
    agent:
      "M2 11h3v2H2zm4-2h3v6H6zm4-3h3v12h-3zm4 3h3v6h-3zm4 2h3v2h-3z",
  };
  return { path: icons[name] || "" };
};
