// ==UserScript==
// @name         ViaRadio Tools (Loader)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Carregador Modular de Ferramentas ViaRadio
// @author       Jhon
// @match        https://viaradio.jupiter.com.br/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    console.log("[ViaRadio Loader] Inicializando...");

    // --- PONTE DE PERMISSÕES ---
    // Expõe as funções do Tampermonkey para os scripts injetados
    unsafeWindow.GM_xmlhttpRequest = GM_xmlhttpRequest;
    unsafeWindow.GM_setClipboard = GM_setClipboard;

    // CONFIGURAÇÃO DA REDE LOCAL
    const BASE_URL = "http://172.16.6.23/mapas/dados/Geogrid%20Clientes%20-%20Jhon/viaradio/";

    const MODULES = [
        "ViaRadio - HUD Mapas-5.0.user.js",
        "ViaRadio - Editor-5.0.user.js",
        //"ViaRádio - Compacto-3.0.user.js"
    ];

    function loadNextScript(index) {
        if (index >= MODULES.length) {
            console.log("[ViaRadio Loader] Todos os módulos carregados.");
            return;
        }

        const file = MODULES[index];
        const url = BASE_URL + encodeURIComponent(file) + "?t=" + new Date().getTime();

        console.log(`[ViaRadio Loader] Injetando: ${file}`);

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (response) {
                if (response.status === 200) {
                    try {
                        const script = document.createElement("script");
                        // Remove o metadata do Tampermonkey se existir para evitar bugs de injeção dupla
                        let code = response.responseText.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, "");
                        script.textContent = code;
                        document.body.appendChild(script);

                        loadNextScript(index + 1);
                    } catch (e) {
                        console.error(`[ViaRadio Loader] Erro ao injetar ${file}:`, e);
                        loadNextScript(index + 1); // Tenta o próximo mesmo com erro
                    }
                } else {
                    console.error(`[ViaRadio Loader] Falha ao carregar ${file} (Status: ${response.status})`);
                    loadNextScript(index + 1);
                }
            },
            onerror: function () {
                console.error(`[ViaRadio Loader] Erro de rede ao carregar ${file}`);
                loadNextScript(index + 1);
            }
        });
    }

    loadNextScript(0);

})();
