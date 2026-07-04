import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./styles.css";
import Home from "./components/Home";
import { queryClient } from "./lib/queryClient";

// Detect Chrome extension environment
if (
  window.chrome &&
  (window.chrome as any).runtime &&
  (window.chrome as any).runtime.id
) {
  document.documentElement.setAttribute("data-extension", "true");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Home />
  </QueryClientProvider>
);
