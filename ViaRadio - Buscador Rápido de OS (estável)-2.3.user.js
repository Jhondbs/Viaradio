// ==UserScript==
// @name         ViaRadio - Visualizador de O.S
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Aperte Numpad, (Vírgula) para buscar OS. Interceta cliques de 'retornarMapaOrdemDeServico' para exibir a imagem e dados. Layout minimalista claro.
// @author       Jhon
// @match        *://viaradio.jupiter.com.br/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

/* --- Estilos minimalistas e claros para o visualizador de OS --- */
const modalCSS = `
    :root{
        --bg: #fbfbfb;
        --panel: #ffffff;
        --muted: #6b7280;
        --accent: #2563eb; /* azul suave */
        --accent-2: #10b981; /* verde suave */
        --border: #e6e9ee;
        --shadow: 0 8px 32px rgba(16,24,40,0.06);
        --radius: 10px;
        --glass: rgba(255,255,255,0.7);
        --mono: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    }

    .hud-modal-os-viewer {
        position: fixed;
        z-index: 2147483646;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(1100px, 86vw);
        height: min(760px, 86vh);
        background: var(--panel);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        border-radius: var(--radius);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: var(--mono);
        color: #0f172a;
    }

    .hud-modal-header {
        background: linear-gradient(180deg, var(--panel), var(--panel));
        padding: 12px 16px;
        cursor: grab;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
    }
    .hud-modal-header:active { cursor: grabbing; }
    .hud-modal-header span {
        font-weight: 600;
        color: #0b1220;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .hud-modal-nav {
        margin-left: auto;
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .hud-modal-close-btn {
        background: transparent;
        border: 1px solid transparent;
        width: 34px;
        height: 34px;
        display: inline-grid;
        place-items: center;
        border-radius: 8px;
        color: var(--muted);
        cursor: pointer;
        transition: background .18s, color .18s, transform .06s;
        font-size: 18px;
    }
    .hud-modal-close-btn:hover {
        background: #f8fafc;
        color: #e11d48;
        transform: translateY(-1px);
    }

    .hud-modal-content-wrapper {
        display: flex;
        flex: 1 1 auto;
        background: linear-gradient(180deg, #fbfdff, #fbfbfb);
        overflow: hidden;
    }

    .modal-image-pane {
        flex: 2;
        min-width: 360px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: linear-gradient(180deg, #ffffff, #fcfdff);
        overflow: auto;
    }
    .modal-image-pane-display {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }
    .modal-image-pane img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 6px;
        box-shadow: 0 6px 20px rgba(15,23,42,0.06);
        background: #fff;
    }

    /* (MODIFICADO) Estilos para a galeria de Anexos - adicionado justify-content: center */
    .anexos-gallery-container {
        width: 100%;
        height: 100%;
        overflow-y: auto; /* Permite rolar os anexos */
        display: flex;
        flex-wrap: wrap; /* Imagens quebram a linha */
        gap: 10px;
        padding: 10px;
        background: #f8f9fa; /* Fundo leve */
        border-radius: 6px;
        align-content: flex-start; /* Alinha os itens no topo */
        justify-content: center; /* (NOVO) Centraliza as imagens */
    }
    .anexos-gallery-container img {
        /* Duas colunas com um espaço de 5px */
        width: calc(50% - 5px);
        height: auto;
        object-fit: contain; /* 'contain' é melhor para ver a imagem toda */
        border-radius: 6px;
        background: #fff;
        box-shadow: 0 4px 10px rgba(15,23,42,0.05);
        border: 1px solid var(--border);
    }
    /* Em telas menores, passa para uma coluna */
    @media (max-width: 600px) {
         .anexos-gallery-container img {
            width: 100%;
         }
    }


    .modal-no-image-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--muted);
        background: #f8f9fa;
        border-radius: 6px;
        border: 2px dashed var(--border);
    }

    .hud-map-toggle {
        display: flex;
        border-radius: 8px;
        background: #f1f5f9;
        padding: 5px;
        margin-top: 15px;
        flex-shrink: 0;
    }
    .hud-map-toggle button {
        font-family: var(--mono);
        font-size: 13px;
        font-weight: 600;
        padding: 6px 16px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--muted);
        cursor: pointer;
        transition: background .2s, color .2s, box-shadow .2s;
        flex: 1;
        white-space: nowrap;
    }
    .hud-map-toggle button.active {
        background: var(--panel);
        color: var(--accent);
        box-shadow: 0 4px 10px rgba(15,23,42,0.05);
    }
    .hud-map-toggle button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    /* (NOVO) Estilo para o contador */
    .hud-map-toggle button .count {
        background: var(--accent);
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 999px;
        min-width: 18px;
        text-align: center;
    }
    .hud-map-toggle button:disabled .count {
        background: var(--muted);
    }

    .modal-data-pane {
        flex: 1;
        min-width: 280px;
        background: var(--panel);
        border-left: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .data-items-container {
        overflow-y: auto;
        padding: 18px;
        gap: 12px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    /* Estilos para agrupar itens na mesma linha */
    .data-item-row {
        display: flex;
        flex-direction: row;
        gap: 10px; /* Espaço entre os grupos */
        width: 100%;
    }
    .data-item-row .data-item {
        flex: 1; /* Faz os itens dividirem o espaço igualmente */
        min-width: 0; /* Ajuda o flexbox a encolher os itens */
    }
    .data-item-row .data-item.full-width {
        flex-basis: 100%; /* Para o item de Cliente e Localização */
    }


    .data-item {
        padding: 8px 10px;
        background: rgba(15,23,42,0.02);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .data-item-label {
        font-weight: 600;
        color: #334155;
        font-size: 13px;
    }
    .data-item-value {
        font-size: 14px;
        color: #0b1220;
        word-wrap: break-word;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .data-item-value.wrap {
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
    }

    .data-item-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
    }

    .data-item-copy-btn {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--accent);
        padding: 6px 8px;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        transition: background .12s, color .12s, box-shadow .12s;
        flex: 1;
        text-align: center;
    }
    .data-item-copy-btn:hover {
        background: rgba(37,99,235,0.06);
        box-shadow: 0 4px 14px rgba(37,99,235,0.06);
    }
    .data-item-copy-btn:disabled {
        color: var(--muted);
        background: transparent;
        opacity: 0.6;
        cursor: not-allowed;
    }

    .hud-modal-actions {
        padding: 14px;
        border-top: 1px solid var(--border);
        background: #fff;
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
    }
    .hud-modal-actions .left, .hud-modal-actions .right { display:flex; gap:8px; align-items:center; }

    .hud-modal-primary-btn {
        background: var(--accent-2);
        color: white;
        border: none;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        min-width: 160px;
        box-shadow: 0 6px 16px rgba(16,185,129,0.12);
    }
    .hud-modal-primary-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .hud-modal-nav-btn {
        background: transparent;
        border: 1px solid var(--border);
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        color: #0f172a;
    }
    .hud-modal-nav-btn:hover {
        background: #fbfdff;
    }

    @media (max-width: 900px) {
        .hud-modal-os-viewer { width: 95vw; height: 92vh; }
        .modal-image-pane { padding: 12px; }
        .data-items-container { padding: 12px; }
        .hud-modal-content-wrapper { flex-direction: column; }
        .modal-data-pane { border-left: none; border-top: 1px solid var(--border); max-height: 45%; }

        .data-item-row {
            flex-wrap: wrap;
        }
    }

    .data-item-copyable {
        cursor: pointer;
        transition: background .12s, box-shadow .12s, transform .05s;
    }
    .data-item-copyable:hover {
        background: rgba(37, 99, 235, 0.05); /* Um leve tom azul no hover */
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
    }
    .data-item-copyable:active {
        transform: translateY(1px); /* Efeito de clique */
        background: rgba(37, 99, 235, 0.08);
    }
`;
/* --- Fim do CSS --- */

(function() {
    'use strict';

    const styleEl = document.createElement('style');
    styleEl.textContent = modalCSS;
    document.head.appendChild(styleEl);

    let currentLinkElement = null;
    let installationLinkElement = null;

    // Atalho: NumpadComma ou NumpadDecimal
    document.addEventListener('keydown', (e) => {
        if (e.code === 'NumpadComma' || e.code === 'NumpadDecimal') {
            // Remover essa função
        }
    }, false);

    // Intercepta cliques em links que contenham 'retornarMapaOrdemDeServico'
    document.body.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.includes('retornarMapaOrdemDeServico')) {
            e.preventDefault();

            currentLinkElement = link;
            const td = currentLinkElement.closest('td');
            installationLinkElement = null;
            if (td) {
                installationLinkElement = Array.from(td.querySelectorAll('a')).find(a => a.textContent.includes('Instalação'));
            }

            await showOSModalForLink(currentLinkElement, installationLinkElement);
        }
    }, true);

    /**
     * Função central para processar o clique
     */
    async function showOSModalForLink(linkElement) {
        if (!linkElement) return;

        let osNumberViabilidade = null;
        let osNumberInstalacao = null;

        try {
            const urlV = new URL(linkElement.href, window.location.origin);
            osNumberViabilidade = urlV.searchParams.get('ordemdeservico');

            const td = linkElement.closest('td');
            if (td) {
                const instalacaoLink = Array.from(td.querySelectorAll('a')).find(a => a.textContent.includes('Instalação'));
                if (instalacaoLink) {
                    const urlI = new URL(instalacaoLink.href, window.location.origin);
                    osNumberInstalacao = urlI.searchParams.get('ordemdeservico');
                    installationLinkElement = instalacaoLink;
                }
            }
        } catch (err) { /* ignore */ }

        if (!osNumberViabilidade) {
            console.error("Não foi possível extrair o nº da OS do link.");
            return;
        }

        let numeroCaixa = null;
        const tr = linkElement.closest('tr');
        if (tr) {
            const fontTag = tr.querySelector('font[color="#0099FF"]');
            if (fontTag) numeroCaixa = fontTag.textContent.trim();
        }

        try {
            const osDataPromise = fetchOSData(osNumberViabilidade);
            const redePromise = numeroCaixa ? fetchRedeRadacct(numeroCaixa) : Promise.resolve(null);
            const osInstalacaoDataPromise = osNumberInstalacao ? fetchOSData(osNumberInstalacao) : Promise.resolve(null);

            const [jsonData, redeRadacct, jsonDataInstalacao] = await Promise.all([
                osDataPromise,
                redePromise,
                osInstalacaoDataPromise
            ]);

            if (!jsonData) {
                 console.error("Nenhuma informação JSON encontrada para esta OS.");
                 return;
            }

            let observacaoInstalacao = null;
            let anexos = [];

            if (osNumberInstalacao) {
                const obsData = await fetchInstalacaoObsEId(osNumberInstalacao);
                if (obsData) {
                    observacaoInstalacao = obsData.observacao;
                    if (obsData.historicoId) {
                        anexos = await fetchHistoricoAnexos(obsData.historicoId);
                    }
                }
            }

            // --- LÓGICA DE FALLBACK DE LOCALIZAÇÃO ---
            let locationData = { textToCopy: null };
            const coords = extractCoordsFromJSON(jsonData);
            if (coords) {
                let coordString = `${coords.lat},${coords.lon}`;
                if (numeroCaixa) coordString += ` ${numeroCaixa}`;
                locationData = { textToCopy: coordString };
            } else {
                const linkJson = extractLinkFromJSON(jsonData);
                if (linkJson) {
                    locationData = { textToCopy: linkJson };
                } else {
                    const htmlLinkViabilidade = await fetchAndParseHTMLMapLink(osNumberViabilidade);
                    if (htmlLinkViabilidade) {
                        locationData = { textToCopy: htmlLinkViabilidade };
                    } else if (osNumberInstalacao) {
                        const htmlLinkInstalacao = await fetchAndParseHTMLMapLink(osNumberInstalacao);
                        if (htmlLinkInstalacao) {
                            locationData = { textToCopy: htmlLinkInstalacao };
                        }
                    }
                }
            }
            // --- FIM DA LÓGICA DE FALLBACK ---

            createImageModal(
                jsonData.imagem_mapa,
                osNumberViabilidade,
                jsonData,
                jsonDataInstalacao,
                numeroCaixa,
                redeRadacct,
                true, // Mostrar botões de navegação
                locationData,
                observacaoInstalacao,
                anexos
            );

        } catch (err) {
            console.error("Erro ao buscar dados da OS no clique:", err);
        }
    }


    /**
     * Pede o número da OS e inicia o processo (via Numpad)
     */
    async function triggerOSSearch() {
        const osNumber = prompt("Digite o número da OS:");
        if (!osNumber || !/^\d+$/.test(osNumber.trim())) {
            return;
        }

        currentLinkElement = null;
        installationLinkElement = null;

        try {
            const osDataPromise = fetchOSData(osNumber.trim());
            const htmlLinkPromise = fetchAndParseHTMLMapLink(osNumber.trim());

            const [jsonData, htmlLink] = await Promise.all([osDataPromise, htmlLinkPromise]);

            if (!jsonData) {
                console.error("Nenhuma informação JSON encontrada para esta OS.");
                return;
            }

            // --- LÓGICA DE FALLBACK DE LOCALIZAÇÃO (Numpad) ---
            let locationData = { textToCopy: null };
            const coords = extractCoordsFromJSON(jsonData);
            if (coords) {
                locationData = { textToCopy: `${coords.lat},${coords.lon}` };
            } else {
                const linkJson = extractLinkFromJSON(jsonData);
                if (linkJson) {
                    locationData = { textToCopy: linkJson };
                } else if (htmlLink) {
                    locationData = { textToCopy: htmlLink };
                }
            }
            // --- FIM DA LÓGICA ---

            createImageModal(jsonData.imagem_mapa, osNumber, jsonData, null, null, null, false, locationData, null, []);

        } catch (err) {
            console.error("[Buscador de OS] Erro:", err);
        }
    }

    /**
     * 2. Chama a API 'pegar_ordemdeservico_id.php' (API da OS)
     */
    function fetchOSData(osNumber) {
        if (!osNumber) return Promise.resolve(null);

        const url = `https://viaradio.jupiter.com.br/json/pegar_ordemdeservico_id.php?id=${osNumber}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: { 'User-Agent': 'Mozilla/5.0 (Tampermonkey)', 'Referer': window.location.href },
                onload: (response) => {
                    if (response.status >= 200 && response.status < 400) {
                        try { resolve(JSON.parse(response.responseText)); }
                        catch (e) { reject(new Error('Falha ao analisar JSON da OS.')); }
                    } else {
                        reject(new Error(`Erro de Rede OS: ${response.status}.`));
                    }
                },
                onerror: (err) => reject(new Error('Erro de Rede OS (GM_xmlhttpRequest)')),
                ontimeout: () => reject(new Error('Timeout da OS'))
            });
        });
    }

    /**
     * 3. Chama a API 'pegar_usuarios_contrato.php' (API do Contrato)
     */
    function fetchRedeRadacct(contratoNumber) {
        if (!contratoNumber) return Promise.resolve(null);

        const url = `https://viaradio.jupiter.com.br/json/pegar_usuarios_contrato.php?contrato=${contratoNumber}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: { 'User-Agent': 'Mozilla/5.0 (Tampermonkey)', 'Referer': window.location.href },
                onload: (response) => {
                    if (response.status >= 200 && response.status < 400) {
                        try {
                            const data = JSON.parse(response.responseText);
                            resolve(data[0] ? data[0].rede_radacct : null);
                        } catch (e) {
                            reject(new Error('Falha ao analisar JSON do Contrato.'));
                        }
                    } else {
                        reject(new Error(`Erro de Rede Contrato: ${response.status}.`));
                    }
                },
                onerror: (err) => reject(new Error('Erro de Rede Contrato (GM_xmlhttpRequest)')),
                ontimeout: () => reject(new Error('Timeout do Contrato'))
            });
        });
    }

    /**
     * 4. Fallback: Busca o HTML da OS para encontrar um link de mapa
     */
    function fetchAndParseHTMLMapLink(osNumber) {
        if (!osNumber) return Promise.resolve(null);

        const url = `https://viaradio.jupiter.com.br/retornardadosos.php?os=${osNumber}`;
        const regex = /<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>Ver (localizaç|no Maps)[^<]*<\/a>/i;

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: { 'User-Agent': 'Mozilla/5.0 (Tampermonkey)', 'Referer': window.location.href },
                onload: (response) => {
                    if (response.status >= 200 && response.status < 400) {
                        try {
                            const html = response.responseText;
                            const match = html.match(regex);
                            if (match && match[1]) {
                                resolve(match[1]); // Retorna o link
                            } else {
                                resolve(null); // Sem link
                            }
                        } catch (e) { resolve(null); }
                    } else { resolve(null); }
                },
                onerror: () => resolve(null),
                ontimeout: () => resolve(null)
            });
        });
    }

    /**
     * 5. Busca o HTML da OS de Instalação para extrair a Observação E o ID do Histórico
     */
    function fetchInstalacaoObsEId(osNumber) {
        if (!osNumber) return Promise.resolve({ observacao: null, historicoId: null });

        const url = `https://viaradio.jupiter.com.br/retornardadosos.php?os=${osNumber}`;

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: { 'User-Agent': 'Mozilla/5.0 (Tampermonkey)', 'Referer': window.location.href },
                onload: (response) => {
                    if (response.status >= 200 && response.status < 400) {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(response.responseText, 'text/html');

                            const allTds = doc.querySelectorAll('td');
                            let observacao = null;
                            let historicoId = null;

                            for (let i = 0; i < allTds.length; i++) {
                                if (allTds[i].textContent.trim() === 'Concluído') {
                                    const obsTd = allTds[i].previousElementSibling;
                                    if (obsTd && obsTd.tagName === 'TD') {
                                        observacao = obsTd.textContent.trim();
                                        // Pegamos o ID do <td> da Observação, que é o ID do histórico
                                        historicoId = obsTd.id || null;
                                        break;
                                    }
                                }
                            }
                            resolve({ observacao, historicoId });
                        } catch (e) {
                            console.error("Erro ao parsear observacao:", e);
                            resolve({ observacao: null, historicoId: null });
                        }
                    } else {
                        resolve({ observacao: null, historicoId: null });
                    }
                },
                onerror: () => resolve({ observacao: null, historicoId: null }),
                ontimeout: () => resolve({ observacao: null, historicoId: null })
            });
        });
    }

    /**
     * 6. Busca os Anexos (imagens) de um histórico específico
     */
    function fetchHistoricoAnexos(historicoId) {
        if (!historicoId) return Promise.resolve([]);

        const url = `https://viaradio.jupiter.com.br/json/retornar_dados_historico_os.php?historico=${historicoId}`;
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: { 'User-Agent': 'Mozilla/5.0 (Tampermonkey)', 'Referer': window.location.href },
                onload: (response) => {
                    if (response.status >= 200 && response.status < 400) {
                        try {
                            const data = JSON.parse(response.responseText);
                            if (data.success === "1" && data.supervisao && data.supervisao.imagens) {
                                resolve(data.supervisao.imagens);
                            } else {
                                resolve([]);
                            }
                        } catch (e) {
                            console.error("Erro ao parsear JSON dos Anexos:", e);
                            resolve([]);
                        }
                    } else {
                        resolve([]);
                    }
                },
                onerror: () => resolve([]),
                ontimeout: () => resolve([])
            });
        });
    }


    /**
     * 3a. Extrai as coordenadas do JSON
     */
    function extractCoordsFromJSON(data) {
        try {
            if (!data) return null;
            const atributos = JSON.parse(data.atributos || "{}");
            const lat = atributos.latitude;
            const lng = atributos.longitude;
            if (lat && lng) return { lat: lat, lon: lng };
        } catch (e) {}
        return null;
    }

    /**
     * 3b. Extrai o link do mapa do JSON
     */
    function extractLinkFromJSON(data) {
        try {
            if (!data) return null;
            const dadosMapa = JSON.parse(data.dados_mapa || "{}");
            let link = dadosMapa.descricaoObservacao;
            if (link) {
                link = link.replace(/https?:\/\/http/i, 'http');
                return link;
            }
        } catch (e) {}
        return null;
    }


    // --- (REMOVIDO) Funções de Notificação (Toast) ---
    function showToast() {}
    function removeToast() {}

    // --- Modal visualizador ---
    function createImageModal(base64Image, osNumber, jsonData, jsonDataInstalacao, numeroCaixa, redeRadacct, showNavButtons = false, locationData, observacaoInstalacao, anexos = []) {
        const oldModal = document.getElementById('hud-os-image-modal');
        if (oldModal) oldModal.remove();

        // --- Armazena os dados buscados para o toggle ---
        const dataStore = {
            viabilidade: {
                jsonData: jsonData,
                image: base64Image,
                os: osNumber
            },
            instalacao: {
                jsonData: jsonDataInstalacao,
                image: jsonDataInstalacao ? jsonDataInstalacao.imagem_mapa : null,
                os: jsonDataInstalacao ? jsonDataInstalacao.id : null
            },
            anexos: {
                images: anexos || [],
                os: null
            }
        };
        // --- Fim do armaz. de dados ---

        // --- Parse de todos os dados (para o painel da direita) ---
        let cliente = "N/D";
        let contrato = numeroCaixa || "N/D";
        let mapa = osNumber || "N/D";
        let caixa = "N/D";
        let redeMapa = "N/D";
        let redeReal = redeRadacct || "N/D";
        let textToCopy = locationData ? locationData.textToCopy : null;
        let coordsString = locationData ? (locationData.textToCopy || "N/D") : "N/D";
        let observacao = observacaoInstalacao || "N/D";

        if (jsonData) {
            cliente = jsonData.nomecliente || "N/D";
            try {
                const dadosMapa = JSON.parse(jsonData.dados_mapa || "{}");
                if (dadosMapa.terminalSelecionado) caixa = dadosMapa.terminalSelecionado.replace(/PT/i, '').trim();
                if (dadosMapa.descricaoRede) {
                    const descRede = dadosMapa.descricaoRede.trim();
                    const partesRede = descRede.split(' - ');
                    if (partesRede.length > 1 && /^\d+$/.test(partesRede[0].trim())) {
                        redeMapa = partesRede[partesRede.length - 1].trim();
                    } else {
                        redeMapa = partesRede[0].trim() || descRede;
                    }
                }
            } catch (e) {}
        }

        let caixaInstalacao = "N/D";
        if (jsonDataInstalacao) {
            try {
                const dadosMapaInst = JSON.parse(jsonDataInstalacao.dados_mapa || "{}");
                if (dadosMapaInst.terminalSelecionado) {
                    caixaInstalacao = dadosMapaInst.terminalSelecionado.replace(/PT/i, '').trim();
                }
            } catch (e) {}
        }
        // --- Fim do parse ---

        const modal = document.createElement('div');
        modal.id = 'hud-os-image-modal';
        modal.className = 'hud-modal-os-viewer';
        modal.style.zIndex = '2147483645';

        const titleText = redeRadacct ? `OS: ${osNumber} | Rede: ${redeRadacct}` : `Imagem do Mapa - OS: ${osNumber}`;

        const navHtml = showNavButtons ? `
            <div class="hud-modal-nav-group">
                <button id="hud-nav-prev" class="hud-modal-nav-btn">&lt; Anterior</button>
                <button id="hud-nav-next" class="hud-modal-nav-btn">Próximo &gt;</button>
            </div>
        ` : '';

        const imagePaneHtml = dataStore.viabilidade.image
            ? `<div class="modal-image-pane-display"><img id="hud-map-image-element" src="data:image/png;base64,${dataStore.viabilidade.image}" alt="Mapa OS ${osNumber}"></div>`
            : `<div class="modal-image-pane-display"><div class="modal-no-image-placeholder" id="hud-map-image-placeholder">ORDEM SEM MAPA ANEXADO</div></div>`;

        // (MODIFICADO) toggleHtml agora inclui o contador dentro do botão de Anexos
        const toggleHtml = `
            <div class="hud-map-toggle">
                <button id="hud-toggle-viabilidade" class="active">Viabilidade</button>
                <button id="hud-toggle-instalacao">Instalação</button>
                <button id="hud-toggle-anexos">Anexos (${dataStore.anexos.images.length})</button>
            </div>
        `;

        // --- HTML do Modal atualizado com Linha 6 ---
        modal.innerHTML = `
            <div class="hud-modal-header">
                <span id="hud-modal-title" title="${titleText}">${titleText}</span>
                <div class="hud-modal-nav">
                    <button id="hud-modal-close-btn" class="hud-modal-close-btn" title="Fechar (Esc)">×</button>
                </div>
            </div>
            <div class="hud-modal-content-wrapper">
                <div class="modal-image-pane">
                    ${imagePaneHtml}
                    ${toggleHtml}
                </div>
                <div class="modal-data-pane">
                    <div class="data-items-container">

                        <div class="data-item-row">
                            <div class="data-item full-width">
                                <div class="data-item-label">Cliente</div>
                                <div class="data-item-value">${cliente}</div>
                            </div>
                        </div>

                        <div class="data-item-row">
                            <div class="data-item data-item-copyable" id="copy-contrato">
                                <div class="data-item-label">Contrato</div>
                                <div class="data-item-value">${contrato}</div>
                            </div>
                            <div class="data-item data-item-copyable" id="copy-mapa">
                                <div class="data-item-label">Mapa</div>
                                <div class="data-item-value">${mapa}</div>
                            </div>
                            <div class="data-item data-item-copyable" id="copy-caixa-viab">
                                <div class="data-item-label">Caixa (Viab.)</div>
                                <div class="data-item-value">${caixa}</div>
                            </div>
                        </div>

                        <div class="data-item-row">
                            <div class="data-item data-item-copyable" id="copy-rede-viab">
                                <div class="data-item-label">Rede (Viab.)</div>
                                <div class="data-item-value">${redeMapa}</div>
                            </div>
                            <div class="data-item data-item-copyable" id="copy-caixa-inst">
                                <div class="data-item-label">Caixa (Inst.)</div>
                                <div class="data-item-value">${caixaInstalacao}</div>
                            </div>
                        </div>

                        <div class="data-item-row">
                            <div class="data-item full-width">
                                <div class="data-item-label">Rede Real</div>
                                <div class="data-item-value">${redeReal}</div>
                            </div>
                        </div>

                        <div class="data-item-row">
                            <div class="data-item full-width">
                                <div class="data-item-label">Localização</div>
                                <div class="data-item-actions">
                                    <button id="hud-copy-coords-btn" class="data-item-copy-btn" title="Copiar Localização">Copiar Localização</button>
                                </div>
                            </div>
                        </div>

                        <div class="data-item-row">
                            <div class="data-item full-width">
                                <div class="data-item-label">Observação</div>
                                <div class="data-item-value wrap">${observacao}</div>
                            </div>
                        </div>

                    </div>

                    <div class="hud-modal-actions">
                        <div class="left">
                            <button id="hud-emitir-ordem-btn" class="hud-modal-primary-btn">Emitir Ordem</button>
                        </div>
                        <div class="right">
                            ${navHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        // --- Fim da Modificação do HTML ---

        document.body.appendChild(modal);

        // --- (NOVO) Lógica para copiar dados dos campos ---

        // Função de feedback visual
        const showCopyFeedback = (element, originalLabel) => {
            element.querySelector('.data-item-label').textContent = 'Copiado!';
            element.style.background = '#e0f2fe'; // Fundo azul-claro
            setTimeout(() => {
                element.querySelector('.data-item-label').textContent = originalLabel;
                element.style.background = ''; // Reseta o fundo
            }, 800);
        };

        // 1. Contrato
        const btnCopyContrato = modal.querySelector('#copy-contrato');
        if (contrato !== 'N/D') {
            btnCopyContrato.addEventListener('click', () => {
                GM_setClipboard(contrato);
                showCopyFeedback(btnCopyContrato, 'Contrato');
            });
        } else { btnCopyContrato.classList.remove('data-item-copyable'); }

        // 2. Mapa
        const btnCopyMapa = modal.querySelector('#copy-mapa');
        if (mapa !== 'N/D') {
            btnCopyMapa.addEventListener('click', () => {
                GM_setClipboard(mapa);
                showCopyFeedback(btnCopyMapa, 'Mapa');
            });
        } else { btnCopyMapa.classList.remove('data-item-copyable'); }

        // 3. Caixa (Viab.) - com lógica "PT"
        const btnCopyCaixaViab = modal.querySelector('#copy-caixa-viab');
        if (caixa !== 'N/D') {
            btnCopyCaixaViab.addEventListener('click', () => {
                GM_setClipboard(`PT${caixa}`);
                showCopyFeedback(btnCopyCaixaViab, 'Caixa (Viab.)');
            });
        } else { btnCopyCaixaViab.classList.remove('data-item-copyable'); }

        // 4. Rede (Viab.)
        const btnCopyRedeViab = modal.querySelector('#copy-rede-viab');
        if (redeMapa !== 'N/D') {
            btnCopyRedeViab.addEventListener('click', () => {
                GM_setClipboard(redeMapa);
                showCopyFeedback(btnCopyRedeViab, 'Rede (Viab.)');
            });
        } else { btnCopyRedeViab.classList.remove('data-item-copyable'); }

        // 5. Caixa (Inst.) - com lógica "PT"
        const btnCopyCaixaInst = modal.querySelector('#copy-caixa-inst');
        if (caixaInstalacao !== 'N/D') {
            btnCopyCaixaInst.addEventListener('click', () => {
                GM_setClipboard(`PT${caixaInstalacao}`);
                showCopyFeedback(btnCopyCaixaInst, 'Caixa (Inst.)');
            });
        } else { btnCopyCaixaInst.classList.remove('data-item-copyable'); }

        // --- Fim da nova lógica de cópia ---

        // --- Lógica do Toggle Switch ---
        const btnToggleViabilidade = modal.querySelector('#hud-toggle-viabilidade');
        const btnToggleInstalacao = modal.querySelector('#hud-toggle-instalacao');
        const btnToggleAnexos = modal.querySelector('#hud-toggle-anexos');
        const imageDisplayContainer = modal.querySelector('.modal-image-pane-display');

        const setMapImage = (type) => {
            btnToggleViabilidade.classList.remove('active');
            btnToggleInstalacao.classList.remove('active');
            btnToggleAnexos.classList.remove('active');

            if (type === 'viabilidade' || type === 'instalacao') {
                const imageData = dataStore[type].image;
                const osNum = dataStore[type].os;
                if (imageData) {
                    imageDisplayContainer.innerHTML = `<img id="hud-map-image-element" src="data:image/png;base64,${imageData}" alt="Mapa OS ${osNum}">`;
                } else {
                    imageDisplayContainer.innerHTML = `<div class="modal-no-image-placeholder" id="hud-map-image-placeholder">ORDEM SEM MAPA ANEXADO</div>`;
                }
                if (type === 'viabilidade') btnToggleViabilidade.classList.add('active');
                if (type === 'instalacao') btnToggleInstalacao.classList.add('active');

            } else if (type === 'anexos') {
                const images = dataStore.anexos.images;
                if (images && images.length > 0) {
                    let galleryHtml = '<div class="anexos-gallery-container">';
                    images.forEach(imgBase64 => {
                        galleryHtml += `<img src="data:image/png;base64,${imgBase64}" alt="Anexo">`;
                    });
                    galleryHtml += '</div>';
                    imageDisplayContainer.innerHTML = galleryHtml;
                } else {
                    imageDisplayContainer.innerHTML = `<div class="modal-no-image-placeholder" id="hud-map-image-placeholder">SEM ANEXOS</div>`;
                }
                btnToggleAnexos.classList.add('active');
            }
        };

        btnToggleViabilidade.addEventListener('click', () => setMapImage('viabilidade'));
        btnToggleInstalacao.addEventListener('click', () => setMapImage('instalacao'));
        btnToggleAnexos.addEventListener('click', () => setMapImage('anexos'));

        if (!dataStore.instalacao.jsonData) {
            btnToggleInstalacao.disabled = true;
        }
        if (!dataStore.anexos.images || dataStore.anexos.images.length === 0) {
             btnToggleAnexos.disabled = true;
        }

        if (!showNavButtons) {
            modal.querySelector('.hud-map-toggle').style.display = 'none';
        }
        // --- Fim da Lógica do Toggle ---


        // --- Listeners de Fecho, Cópia, Navegação e Drag ---

        const closeModal = (isNavigating = false) => {
            modal.remove();
            if (!isNavigating) {
                currentLinkElement = null;
                installationLinkElement = null;
            }
            document.removeEventListener('keydown', handleEscKey);
        };
        const handleEscKey = (e) => { if (e.key === 'Escape') closeModal(false); };
        modal.querySelector('#hud-modal-close-btn').addEventListener('click', () => closeModal(false));
        document.addEventListener('keydown', handleEscKey);

        const copyBtn = modal.querySelector('#hud-copy-coords-btn');
        if (textToCopy) {
            copyBtn.addEventListener('click', () => {
                GM_setClipboard(textToCopy);
                copyBtn.textContent = 'Copiado!';
                setTimeout(()=> copyBtn.textContent = 'Copiar Localização', 800);
            });
        } else {
            copyBtn.textContent = 'N/D';
            copyBtn.disabled = true;
        }

        const btnEmitirOrdem = modal.querySelector('#hud-emitir-ordem-btn');
        if (currentLinkElement) {
            btnEmitirOrdem.addEventListener('click', () => {
                try {
                    window.open(currentLinkElement.href, '_blank');
                } catch (e) { console.error(e); }
            });
        } else {
            btnEmitirOrdem.disabled = true;
        }

        if (showNavButtons) {
            const btnPrev = modal.querySelector('#hud-nav-prev');
            const btnNext = modal.querySelector('#hud-nav-next');
            const currentRow = currentLinkElement ? currentLinkElement.closest('tr') : null;

            const prevRow = currentRow ? currentRow.previousElementSibling : null;
            const prevLink = prevRow ? prevRow.querySelector('a[href*="retornarMapaOrdemDeServico"]') : null;
            if (prevLink) {
                btnPrev.addEventListener('click', () => {
                    const prevInstallationLink = Array.from(prevRow.querySelectorAll('a')).find(a => a.textContent.includes('Instalação'));
                    currentLinkElement = prevLink;
                    installationLinkElement = prevInstallationLink;
                    closeModal(true);
                    showOSModalForLink(prevLink, prevInstallationLink);
                });
            } else btnPrev.disabled = true;

            const nextRow = currentRow ? currentRow.nextElementSibling : null;
            const nextLink = nextRow ? nextRow.querySelector('a[href*="retornarMapaOrdemDeServico"]') : null;
            if (nextLink) {
                btnNext.addEventListener('click', () => {
                    const nextInstallationLink = Array.from(nextRow.querySelectorAll('a')).find(a => a.textContent.includes('Instalação'));
                    currentLinkElement = nextLink;
                    installationLinkElement = nextInstallationLink;
                    closeModal(true);
                    showOSModalForLink(nextLink, nextInstallationLink);
                });
            } else btnNext.disabled = true;
        }

        // Drag
        const header = modal.querySelector('.hud-modal-header');
        let isDragging = false;
        let offsetX = 0, offsetY = 0;
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = modal.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            document.body.style.userSelect = 'none';
            header.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;
            modal.style.left = `${newLeft}px`;
            modal.style.top = `${newTop}px`;
            modal.style.transform = 'none';
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = 'auto';
            header.style.cursor = 'grab';
        });
    }

})();
