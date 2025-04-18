import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL;
  const clientUrl = env.VITE_CLIENT_URL;

  return {
    plugins: [react(), tailwindcss()],
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    server: {
      port: 5173,
      proxy: {
        "/auth": {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
      cors: true,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    define: {
      "process.env.VITE_API_URL": JSON.stringify(apiUrl),
      "process.env.VITE_CLIENT_URL": JSON.stringify(clientUrl),
    },
  };
});
