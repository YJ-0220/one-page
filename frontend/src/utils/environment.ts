export const getBasePath = () => {
  return window.location.hostname.includes("github.io")
    ? "/one-page"
    : "/";
};
