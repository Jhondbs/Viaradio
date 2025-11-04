// ==UserScript==
// @name         ViaRadio - Buscador Rápido de OS
// @namespace    http://tampermonkey.net/
// @version      2.4
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
        flex-direction: column; /* (NOVO) Modificado para empilhar imagem e toggle */
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: linear-gradient(180deg, #ffffff, #fcfdff);
        overflow: auto;
    }
    .modal-image-pane-display { /* (NOVO) Wrapper para a imagem */
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

    /* --- (NOVO) Estilos para o Toggle Switch --- */
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
    /* --- Fim do CSS do Toggle --- */

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

    .data-item {
        padding: 10px 12px;
        background: rgba(15,23,42,0.02);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
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
    }
    .data-item-copy-btn:hover {
        background: rgba(37,99,235,0.06);
        box-shadow: 0 4px 14px rgba(37,99,235,0.06);
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
        .hud-modal-content-wrapper { flex-direction: column; } /* (NOVO) Empilha em telas menores */
        .modal-data-pane { border-left: none; border-top: 1px solid var(--border); max-height: 45%; }
    }
`;
/* --- Fim do CSS --- */

(function() {
    'use strict';

    const styleEl = document.createElement('style');
    styleEl.textContent = modalCSS;
    document.head.appendChild(styleEl);

    let loadingToast = null;
    let currentLinkElement = null; // Armazena o link <a> 'Viabilidade'
    let installationLinkElement = null; // (NOVO) Armazena o link <a> 'Instalação'

    // Atalho: NumpadComma ou NumpadDecimal
    document.addEventListener('keydown', (e) => {
        if (e.code === 'NumpadComma') {
         //   e.preventDefault();
            //triggerOSSearch();
        }
    }, false);

    // Intercepta cliques em links que contenham 'retornarMapaOrdemDeServico'
    document.body.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.includes('retornarMapaOrdemDeServico')) {
            e.preventDefault();

            // (MODIFICADO) Guarda o link clicado (Viabilidade) e procura o de Instalação
            currentLinkElement = link;
            const td = currentLinkElement.closest('td');
            installationLinkElement = null; // Reseta
            if (td) {
                // Procura o link de instalação na mesma célula
                installationLinkElement = Array.from(td.querySelectorAll('a')).find(a => a.textContent.includes('Instalação'));
            }

            await showOSModalForLink(currentLinkElement, installationLinkElement);
        }
    }, true);

    /**
     * (MODIFICADO) Função central para processar o clique
     * Agora aceita ambos os links
     */
    async function showOSModalForLink(viabilidadeLink, instalacaoLink) {
        if (!viabilidadeLink) return;

        let osNumberViabilidade = null;
        let osNumberInstalacao = null;

        try {
            const urlV = new URL(viabilidadeLink.href, window.location.origin);
            osNumberViabilidade = urlV.searchParams.get('ordemdeservico');

            if (instalacaoLink) {
                const urlI = new URL(instalacaoLink.href, window.location.origin);
                osNumberInstalacao = urlI.searchParams.get('ordemdeservico');
            }
        } catch (err) { /* ignore */ }

        if (!osNumberViabilidade) {
            showToast("Não foi possível extrair o nº da OS do link.", "error");
            return;
        }

        let numeroCaixa = null;
        const tr = viabilidadeLink.closest('tr');
        if (tr) {
            const fontTag = tr.querySelector('font[color="#0099FF"]');
            if (fontTag) numeroCaixa = fontTag.textContent.trim();
        }

        const toast = showToast(`Buscando OS ${osNumberViabilidade}...`, "loading");

        try {
            // (MODIFICADO) Busca todos os 3 dados em paralelo
            const osDataPromise = fetchOSData(osNumberViabilidade);
            const redePromise = numeroCaixa ? fetchRedeRadacct(numeroCaixa) : Promise.resolve(null);
            const osInstalacaoDataPromise = osNumberInstalacao ? fetchOSData(osNumberInstalacao) : Promise.resolve(null);

            const [jsonData, redeRadacct, jsonDataInstalacao] = await Promise.all([osDataPromise, redePromise, osInstalacaoDataPromise]);
            removeToast(toast);

            // Abre o modal desde que tenhamos os dados da OS principal
            if (jsonData) {
                createImageModal(
                    jsonData.imagem_mapa,
                    osNumberViabilidade,
                    jsonData, // Dados da Viabilidade
                    jsonDataInstalacao, // (NOVO) Dados da Instalação
                    numeroCaixa,
                    redeRadacct,
                    true // Mostrar botões de navegação
                );
            } else {
                 showToast("Nenhuma informação encontrada para esta OS.", "error");
                 return;
            }

            // A lógica de copiar permanece a mesma (baseada na OS de Viabilidade)
            const coords = extractCoordsFromJSON(jsonData);
            if (coords) {
                let out = `${coords.lat},${coords.lon}`;
                if (numeroCaixa) out += ` ${numeroCaixa}`;
                GM_setClipboard(out);
                showToast(`Dados copiados: ${out}`, "success");
                return;
            }

            const linkMapa = extractLinkFromJSON(jsonData);
            if (linkMapa) {
                GM_setClipboard(linkMapa);
                showToast(`Link do mapa copiado!`, "success");
                return;
            }

            showToast("OS aberta (sem coordenadas ou link).", "success");

        } catch (err) {
            removeToast(toast);
            console.error("Erro ao buscar dados da OS no clique:", err);
            showToast("Erro ao buscar dados da OS.", "error");
        }
    }


    /**
     * Pede o número da OS e inicia o processo (via Numpad)
     */
    async function triggerOSSearch() {
        const osNumber = prompt("Digite o número da OS:");
        if (!osNumber || !/^\d+$/.test(osNumber.trim())) {
            if (osNumber) showToast("Número de OS inválido.", "error");
            return;
        }

        loadingToast = showToast(`Buscando OS ${osNumber}…`, "loading");
        currentLinkElement = null; // Sem link de referência
        installationLinkElement = null;

        try {
            const jsonData = await fetchOSData(osNumber.trim());
            removeToast(loadingToast);

            if (jsonData) {
                // (MODIFICADO) Passa null para jsonDataInstalacao e false para nav buttons
                createImageModal(jsonData.imagem_mapa, osNumber, jsonData, null, null, null, false);
            } else {
                showToast("Nenhuma informação encontrada para esta OS.", "error");
                return;
            }

            const coords = extractCoordsFromJSON(jsonData);
            if (coords) {
                const out = `${coords.lat},${coords.lon}`;
                GM_setClipboard(out);
                showToast(`Coordenadas copiadas: ${out}`, "success");
                return;
            }

            const link = extractLinkFromJSON(jsonData);
            if (link) {
                GM_setClipboard(link);
                showToast(`Link do mapa copiado!`, "success");
                return;
            }

            showToast("OS aberta (sem coordenadas ou link).", "success");

        } catch (err) {
            removeToast(loadingToast);
            console.error("[Buscador de OS] Erro:", err);
            showToast("Erro ao carregar dados. Verifique o console (F12).", "error");
        }
    }

    /**
     * 2. Chama a API 'pegar_ordemdeservico_id.php' (API da OS)
     */
    function fetchOSData(osNumber) {
        // (NOVO) Retorna null se o osNumber for nulo (caso o link de instalação não exista)
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
     * Chama a API 'pegar_usuarios_contrato.php' (API do Contrato)
     */
    function fetchRedeRadacct(contratoNumber) {
        if (!contratoNumber) return Promise.resolve(null); // (NOVO) Checagem de segurança

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


    // --- Funções de Notificação (Toast) ---
    function showToast(message, type = 'success') {
        const containerId = '__coords_toast_container';
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            Object.assign(container.style, {
                position: 'fixed',
                top: '14px',
                right: '14px',
                zIndex: 2147483647,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
            });
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.textContent = message;
        let bgColor = '#10b981';
        let autoHide = true;
        switch (type) {
            case 'error': bgColor = 'linear-gradient(135deg,#ef4444,#dc2626)'; break;
            case 'loading': bgColor = 'linear-gradient(135deg,#60a5fa,#3b82f6)'; autoHide = false; break;
            default: bgColor = 'linear-gradient(135deg,#10b981,#059669)'; break;
        }
        Object.assign(toast.style, {
            transform: 'translateX(120%)',
            transition: 'transform 260ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease',
            opacity: '0',
            pointerEvents: 'auto',
            background: bgColor,
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(2,6,23,0.08)',
            fontSize: '13px',
            lineHeight: '1.2',
            maxWidth: '420px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        });
        container.appendChild(toast);
        void toast.offsetWidth;
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
        if (autoHide) {
            setTimeout(() => removeToast(toast), 2200);
        }
        return toast;
    }

    function removeToast(toast) {
        if (!toast) return;
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 280);
    }

    // --- (MODIFICADO) Modal visualizador ---
    function createImageModal(base64Image, osNumber, jsonData, jsonDataInstalacao, numeroCaixa, redeRadacct, showNavButtons = false) {
        const oldModal = document.getElementById('hud-os-image-modal');
        if (oldModal) oldModal.remove();

        // --- Armazena os dados buscados para o toggle ---
        const dataStore = {
            viabilidade: {
                jsonData: jsonData,
                image: base64Image, // Pode ser null
                os: osNumber
            },
            instalacao: {
                jsonData: jsonDataInstalacao, // Pode ser null
                image: jsonDataInstalacao ? jsonDataInstalacao.imagem_mapa : null,
                os: jsonDataInstalacao ? jsonDataInstalacao.id : null
            }
        };
        // --- Fim do armaz. de dados ---

        // --- Parse de todos os dados (para o painel da direita, que não muda) ---
        let cliente = "N/D";
        let contrato = numeroCaixa || "N/D";
        let mapa = osNumber || "N/D";
        let caixa = "N/D";
        let redeMapa = "N/D";
        let redeReal = redeRadacct || "N/D";
        let coords = null;
        let coordsString = "N/D";

        if (jsonData) { // Usamos jsonData (viabilidade) como fonte principal para os dados da direita
            cliente = jsonData.nomecliente || "N/D";
            coords = extractCoordsFromJSON(jsonData);
            if (coords) coordsString = `${coords.lat},${coords.lon}`;
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

        // (NOVO) Define o HTML do painel da imagem dinamicamente (começa com Viabilidade)
        const imagePaneHtml = dataStore.viabilidade.image
            ? `<div class="modal-image-pane-display"><img id="hud-map-image-element" src="data:image/png;base64,${dataStore.viabilidade.image}" alt="Mapa OS ${osNumber}"></div>`
            : `<div class="modal-image-pane-display"><div class="modal-no-image-placeholder" id="hud-map-image-placeholder">ORDEM SEM MAPA ANEXADO</div></div>`;

        // (NOVO) Cria o HTML do Toggle
        const toggleHtml = `
            <div class="hud-map-toggle">
                <button id="hud-toggle-viabilidade" class="active">Viabilidade</button>
                <button id="hud-toggle-instalacao">Instalação</button>
            </div>
        `;

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
                    ${toggleHtml} </div>
                <div class="modal-data-pane">
                    <div class="data-items-container">
                        <div class="data-item"><div class="data-item-label">Cliente</div><div class="data-item-value">${cliente}</div></div>
                        <div class="data-item"><div class="data-item-label">Contrato</div><div class="data-item-value">${contrato}</div></div>
                        <div class="data-item"><div class="data-item-label">Mapa</div><div class="data-item-value">${mapa}</div></div>
                        <div class="data-item"><div class="data-item-label">Caixa</div><div class="data-item-value">${caixa}</div></div>
                        <div class="data-item"><div class="data-item-label">Rede no Mapa</div><div class="data-item-value">${redeMapa}</div></div>
                        <div class="data-item"><div class="data-item-label">Rede Real</div><div class="data-item-value">${redeReal}</div></div>
                        <div class="data-item">
                            <div class="data-item-label">Localização</div>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <div class="data-item-value" id="hud-coords-value">${coordsString}</div>
                                <button id="hud-copy-coords-btn" class="data-item-copy-btn" title="Copiar Coordenadas">copiar</button>
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

        document.body.appendChild(modal);

        // --- (NOVO) Lógica do Toggle Switch ---
        const btnToggleViabilidade = modal.querySelector('#hud-toggle-viabilidade');
        const btnToggleInstalacao = modal.querySelector('#hud-toggle-instalacao');
        const imageDisplayContainer = modal.querySelector('.modal-image-pane-display');

        // Função para trocar a imagem
        const setMapImage = (type) => {
            const imageData = (type === 'viabilidade') ? dataStore.viabilidade.image : dataStore.instalacao.image;
            const osNum = (type === 'viabilidade') ? dataStore.viabilidade.os : dataStore.instalacao.os;

            if (imageData) {
                imageDisplayContainer.innerHTML = `<img id="hud-map-image-element" src="data:image/png;base64,${imageData}" alt="Mapa OS ${osNum}">`;
            } else {
                imageDisplayContainer.innerHTML = `<div class="modal-no-image-placeholder" id="hud-map-image-placeholder">ORDEM SEM MAPA ANEXADO</div>`;
            }

            // Atualiza o estado ativo dos botões
            btnToggleViabilidade.classList.toggle('active', type === 'viabilidade');
            btnToggleInstalacao.classList.toggle('active', type === 'instalacao');
        };

        btnToggleViabilidade.addEventListener('click', () => setMapImage('viabilidade'));
        btnToggleInstalacao.addEventListener('click', () => setMapImage('instalacao'));

        // Desativa o botão de instalação se não houver dados
        if (!dataStore.instalacao.jsonData) {
            btnToggleInstalacao.disabled = true;
        }
        // Se a busca foi pelo Numpad, esconde o toggle
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
        if (coords && coordsString !== "N/D") {
            copyBtn.addEventListener('click', () => {
                GM_setClipboard(coordsString);
                showToast('Coordenadas copiadas!', 'success');
                copyBtn.textContent = 'copiado';
                setTimeout(()=> copyBtn.textContent = 'copiar', 800);
            });
        } else {
            copyBtn.textContent = 'N/D';
            copyBtn.disabled = true;
        }

        const btnEmitirOrdem = modal.querySelector('#hud-emitir-ordem-btn');
        if (currentLinkElement) { // Só ativa se foi um clique
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
