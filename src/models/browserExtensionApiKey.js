import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const BrowserExtensionApiKey = {
  getAll: async () => {
    return await fetch(`${API_BASE}/browser-extension/api-keys`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message, apiKeys: [] };
      });
  },

  generateKey: async () => {
    return await fetch(`${API_BASE}/browser-extension/api-keys/new`, {
      method: "POST",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },

  revoke: async (id) => {
    return await fetch(`${API_BASE}/browser-extension/api-keys/${id}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },

  checkApiKey: async function (apiKey) { // hard code apikey for now
    return await fetch(`${API_BASE}/browser-extension/check`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Bad response to /check");
        return res.json();
      })
      .then((data) => ({ response: { ok: true }, data, error: null }))
      .catch((e) => {
        console.error(e);
        return { response: { ok: false }, data: null, error: e.message };
      });
  },

  embedToWorkspace: async function(apiKey, workspaceId, selectedText, pageTitle, pageUrl) {
    return await fetch(`${API_BASE}/browser-extension/embed-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        workspaceId,
        textContent: selectedText,
        metadata: { title: pageTitle, url: pageUrl },
      }),
    }).then((res) => {
      if (!res.ok) throw new Error("Bad response to /browser-extension/embed-content");
      return res.json();
    })
    .then((data) => ({ response: { ok: true }, data, error: null }))
    .catch((e) => {
      console.error(e);
      return { response: { ok: false }, data: null, error: e.message };
    });
  }

};

export default BrowserExtensionApiKey;
