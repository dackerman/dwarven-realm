import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { addTestButton } from "./test-mobile-ui";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

// Add test button to debug mobile UI issues
// This will add a button to test the mobile UI component directly in the browser
if (process.env.NODE_ENV !== 'production') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      addTestButton();
      console.log('Mobile UI test button added');
    }, 2000);
  });
}
