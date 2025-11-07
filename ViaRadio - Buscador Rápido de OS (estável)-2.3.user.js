// ==UserScript==
// @name         ViaRadio - Visualizador de O.S
// @namespace    http://tampermonkey.net/
// @version      3.7
// @description  Aperte Numpad, (Vírgula) para buscar OS. Interceta cliques de 'retornarMapaOrdemDeServico' para exibir a imagem e dados. Layout minimalista claro.
// @author       Jhon
// @match        *://viaradio.jupiter.com.br/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const currentPageUrl = window.location.href;

    // (NOVA VERIFICAÇÃO) Só executa o script principal nestas duas páginas
    if (!currentPageUrl.includes('adm=atendimentopresencial') && !currentPageUrl.includes('adm=atendimentoportelefone')) {
        console.log('Script: Página não é Presencial nem Telefone. Script inativo.');
        return;
    }

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
        .anexos-gallery-container {
            width: 100%;
            height: 100%;
            overflow-y: auto;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            align-content: flex-start;
            justify-content: center;
        }
        .anexos-gallery-container img {
            width: calc(50% - 5px);
            height: auto;
            object-fit: contain;
            border-radius: 6px;
            background: #fff;
            box-shadow: 0 4px 10px rgba(15,23,42,0.05);
            border: 1px solid var(--border);
        }
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
        .data-item-row {
            display: flex;
            flex-direction: row;
            gap: 10px;
            width: 100%;
        }
        .data-item-row .data-item {
            flex: 1;
            min-width: 0;
        }
        .data-item-row .data-item.full-width {
            flex-basis: 100%;
        }
        .data-item-copyable {
            cursor: pointer;
            transition: background .12s, box-shadow .12s, transform .05s;
        }
        .data-item-copyable:hover {
            background: rgba(37, 99, 235, 0.05);
            box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
        }
        .data-item-copyable:active {
            transform: translateY(1px);
            background: rgba(37, 99, 235, 0.08);
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
        .data-item-value.text-accent {
            color: var(--accent);
            font-weight: 600; /* Um leve destaque */
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
        .hud-modal-actions .left {
            flex: 1;
            display:flex;
            flex-direction: column;
            gap:8px;
            align-items: stretch;
        }
        .hud-modal-actions .right {
            display:flex;
            gap:8px;
            align-items:center;
        }
        .hud-modal-primary-btn {
            background: var(--accent-2);
            color: white;
            border: none;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(16,185,129,0.12);
        }
        .hud-modal-primary-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .hud-modal-secondary-btn {
            background: transparent;
            border: 1px solid var(--border);
            padding: 10px 14px;
            border-radius: 10px;
            cursor: pointer;
            color: #0f172a;
            font-size: 14px;
            font-weight: 700;
        }
        .hud-modal-secondary-btn:hover {
            background: #f8fafc;
        }
        .hud-modal-secondary-btn:disabled {
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
    `;
    /* --- Fim do CSS --- */

    const styleEl = document.createElement('style');
    styleEl.textContent = modalCSS;
    document.head.appendChild(styleEl);

    let currentLinkElement = null;
    let installationLinkElement = null;

    document.addEventListener('keydown', (e) => {
        if (e.code === 'NumpadComma' || e.code === 'NumpadDecimal') {
            // Remover essa função
        }
    }, false);

    document.body.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.includes('retornarMapaOrdemDeServico')) {
            e.preventDefault();
            currentLinkElement = link;
            installationLinkElement = null;
            await showOSModalForLink(currentLinkElement);
        }
    }, true);

    async function showOSModalForLink(linkElement) {
        if (!linkElement) return;

        let osNumberViabilidade = null;
        try {
            const urlV = new URL(linkElement.href, window.location.origin);
            osNumberViabilidade = urlV.searchParams.get('ordemdeservico');
        } catch (err) { /* ignore */ }

        if (!osNumberViabilidade) {
            console.error("Não foi possível extrair o nº da OS do link.");
            return;
        }

        let numeroCaixa = null; // Este é o número do contrato
        const tr = linkElement.closest('tr');
        if (tr) {
            const fontTag = tr.querySelector('font[color="#0099FF"]');
            if (fontTag) numeroCaixa = fontTag.textContent.trim();
        }

        try {
            // --- PASSO 1: Buscar dados da Viabilidade e Rede ---
            const osDataPromise = fetchOSData(osNumberViabilidade);
            const redePromise = numeroCaixa ? fetchRedeRadacct(numeroCaixa) : Promise.resolve(null);
            const [jsonData, redeRadacct] = await Promise.all([osDataPromise, redePromise]);

            if (!jsonData) {
                 console.error("Nenhuma informação JSON encontrada para esta OS.");
                 return;
            }

            // --- PASSO 2: Lógica de Decisão (Mudança ou Instalação) ---
            let osNumberInstalacao = null;
            let contratoDaViabilidade = jsonData.contrato ? jsonData.contrato.trim() : '';

            if (contratoDaViabilidade !== '') {
                // É MUDANÇA DE ENDEREÇO
                console.log('Script: Detectada Mudança de Endereço. Buscando OS correta...');
                osNumberInstalacao = await fetchMudancaEnderecoOS(contratoDaViabilidade);
                console.log(`>>> O número pego para a OS de Mudança foi: ${osNumberInstalacao}`);
            } else {
                // É INSTALAÇÃO NORMAL
                console.log('Script: Detectada Instalação Normal. Buscando link "Instalação"...');
                const td = linkElement.closest('td');
                if (td) {
                    const instalacaoLink = Array.from(td.querySelectorAll('a')).find(a => a.textContent.includes('Instalação'));
                    if (instalacaoLink) {
                        const urlI = new URL(instalacaoLink.href, window.location.origin);
                        osNumberInstalacao = urlI.searchParams.get('ordemdeservico');
                        installationLinkElement = instalacaoLink;
                        console.log(`>>> O número pego para a OS de Instalação foi: ${osNumberInstalacao}`);
                    }
                }
            }

            // --- PASSO 3: Buscar dados da Instalação/Mudança (se encontrados) ---
            const osInstalacaoDataPromise = osNumberInstalacao ? fetchOSData(osNumberInstalacao) : Promise.resolve(null);
            const observacaoDataPromise = osNumberInstalacao ? fetchInstalacaoObsEId(osNumberInstalacao) : Promise.resolve({ observacao: null, historicoId: null });

            const [jsonDataInstalacao, obsData] = await Promise.all([osInstalacaoDataPromise, observacaoDataPromise]);

            let anexos = [];
            const observacaoInstalacao = obsData ? obsData.observacao : null;
            if (obsData && obsData.historicoId) {
                anexos = await fetchHistoricoAnexos(obsData.historicoId);
            }

            // --- PASSO 4: Lógica de Localização (Fallbacks) ---
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

            // --- PASSO 5: Criar o Modal ---
            createImageModal(
                jsonData.imagem_mapa,
                osNumberViabilidade,
                jsonData,
                jsonDataInstalacao,
                numeroCaixa, // Passa o contrato da linha
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


    async function triggerOSSearch() {
        // Esta função de busca (Numpad) provavelmente só funciona bem na 'presencial'
        // mas não vamos bloquear, caso seja útil.
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

            createImageModal(jsonData.imagem_mapa, osNumber, jsonData, null, null, null, false, locationData, null, []);

        } catch (err) {
            console.error("[Buscador de OS] Erro:", err);
        }
    }

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
                                resolve(match[1]);
                            } else {
                                resolve(null);
                            }
                        } catch (e) { resolve(null); }
                    } else { resolve(null); }
                },
                onerror: () => resolve(null),
                ontimeout: () => resolve(null)
            });
        });
    }

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

    function fetchMudancaEnderecoOS(contratoNumber) {
        if (!contratoNumber) return Promise.resolve(null);
        const url = `https://viaradio.jupiter.com.br/painel.php?adm=atendimentopresencial&np=100&p=1&t=1&session=false&status=-1&impressao=0&mapa=0&informado=0&tipoOS_10=10&tipo=2&valorbusca=${contratoNumber}&data-inicial=&data-final=&localidade=0&ordenar=0`;
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
                            const firstRow = doc.querySelector('tr[class^="tros"]');
                            if (firstRow) {
                                const osCell = firstRow.querySelectorAll('td')[0];
                                if (osCell) {
                                    const inputElement = osCell.querySelector('input[type="checkbox"]');
                                    if (inputElement) {
                                        const osNumber = inputElement.value;
                                        console.log(`Script: OS de Mudança de Endereço encontrada: ${osNumber}`);
                                        resolve(osNumber);
                                        return;
                                    }
                                }
                            }
                            console.log('Script: Nenhuma OS de Mudança de Endereço encontrada no HTML.');
                            resolve(null);
                        } catch (e) {
                            console.error("Erro ao parsear HTML da Mudança de Endereço:", e);
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                },
                onerror: () => resolve(null),
                ontimeout: () => resolve(null)
            });
        });
    }

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

    function showToast() {}
    function removeToast() {}

    function createImageModal(base64Image, osNumber, jsonData, jsonDataInstalacao, numeroCaixa, redeRadacct, showNavButtons = false, locationData, observacaoInstalacao, anexos = []) {
        const oldModal = document.getElementById('hud-os-image-modal');
        if (oldModal) oldModal.remove();

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

        let cliente = "N/D";
        let contrato = numeroCaixa || "N/D";
        let mapa = osNumber || "N/D";
        let caixa = "N/D";
        let redeMapa = "N/D";
        let redeReal = redeRadacct || "N/D";
        let textToCopy = locationData ? locationData.textToCopy : null;
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

        const toggleHtml = `
            <div class="hud-map-toggle">
                <button id="hud-toggle-viabilidade" class="active">Viabilidade</button>
                <button id="hud-toggle-instalacao">Instalação</button>
                <button id="hud-toggle-anexos">Anexos (${dataStore.anexos.images.length})</button>
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
                                <div class="data-item-value text-accent">${contrato}</div>
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
                                <div class="data-item-value text-accent">${redeReal}</div>
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
                            <button id="hud-editar-mapa-btn" class="hud-modal-secondary-btn">Editar Mapa</button>
                        </div>
                        <div class="right">
                            ${navHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const showCopyFeedback = (element, originalLabel) => {
            const labelEl = element.querySelector('.data-item-label');
            if (!labelEl) return;
            labelEl.textContent = 'Copiado!';
            element.style.background = '#e0f2fe';
            setTimeout(() => {
                labelEl.textContent = originalLabel;
                element.style.background = '';
            }, 800);
        };

        const btnCopyContrato = modal.querySelector('#copy-contrato');
        if (contrato !== 'N/D') {
            btnCopyContrato.addEventListener('click', () => {
                GM_setClipboard(contrato);
                showCopyFeedback(btnCopyContrato, 'Contrato');
            });
        } else { btnCopyContrato.classList.remove('data-item-copyable'); }

        const btnCopyMapa = modal.querySelector('#copy-mapa');
        if (mapa !== 'N/D') {
            btnCopyMapa.addEventListener('click', () => {
                GM_setClipboard(mapa);
                showCopyFeedback(btnCopyMapa, 'Mapa');
            });
        } else { btnCopyMapa.classList.remove('data-item-copyable'); }

        const btnCopyCaixaViab = modal.querySelector('#copy-caixa-viab');
        if (caixa !== 'N/D') {
            btnCopyCaixaViab.addEventListener('click', () => {
                GM_setClipboard(`PT${caixa}`);
                showCopyFeedback(btnCopyCaixaViab, 'Caixa (Viab.)');
            });
        } else { btnCopyCaixaViab.classList.remove('data-item-copyable'); }

        const btnCopyRedeViab = modal.querySelector('#copy-rede-viab');
        if (redeMapa !== 'N/D') {
            btnCopyRedeViab.addEventListener('click', () => {
                GM_setClipboard(redeMapa);
                showCopyFeedback(btnCopyRedeViab, 'Rede (Viab.)');
            });
        } else { btnCopyRedeViab.classList.remove('data-item-copyable'); }

        const btnCopyCaixaInst = modal.querySelector('#copy-caixa-inst');
        if (caixaInstalacao !== 'N/D') {
            btnCopyCaixaInst.addEventListener('click', () => {
                GM_setClipboard(`PT${caixaInstalacao}`);
                showCopyFeedback(btnCopyCaixaInst, 'Caixa (Inst.)');
            });
        } else { btnCopyCaixaInst.classList.remove('data-item-copyable'); }

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

        // (CORRIGIDO) Listener para o botão "Editar Mapa" com verificação de página
        const btnEditarMapa = modal.querySelector('#hud-editar-mapa-btn');

        // Só tenta habilitar o botão se estivermos na página 'presencial' E houver um link clicado
        if (currentLinkElement && currentPageUrl.includes('adm=atendimentopresencial')) {
            btnEditarMapa.addEventListener('click', () => {
                try {
                    const currentRow = currentLinkElement.closest('tr');
                    if (!currentRow) {
                        throw new Error("Não foi possível encontrar a 'tr' (linha) original.");
                    }

                    const checkbox = currentRow.querySelector('input[type="checkbox"]');
                    if (!checkbox) {
                        throw new Error("Não foi possível encontrar o checkbox na linha.");
                    }

                    checkbox.checked = true;

                    const scriptContent = `uploadMapa(${osNumber});`;
                    const scriptEl = document.createElement('script');
                    scriptEl.textContent = scriptContent;

                    document.body.appendChild(scriptEl);
                    document.body.removeChild(scriptEl);

                    console.log(`Script: Checkbox marcado. Chamando uploadMapa(${osNumber}) no escopo da página.`);

                    closeModal(false);

                    setTimeout(() => {
                        checkbox.checked = false;
                    }, 500);

                } catch (e) {
                    console.error("Erro ao tentar chamar uploadMapa:", e);
                    btnEditarMapa.textContent = "Erro ao chamar";
                    btnEditarMapa.disabled = true;
                }
            });
        } else {
            // Desabilita se for 'atendimentoportelefone' ou se foi aberto pelo Numpad
            btnEditarMapa.disabled = true;
        }


        if (showNavButtons) {
            const btnPrev = modal.querySelector('#hud-nav-prev');
            const btnNext = modal.querySelector('#hud-nav-next');
            const currentRow = currentLinkElement ? currentLinkElement.closest('tr') : null;

            const prevRow = currentRow ? currentRow.previousElementSibling : null;
            const prevLink = prevRow ? prevRow.querySelector('a[href*="retornarMapaOrdemDeServico"]') : null;
            if (prevLink) {
                btnPrev.addEventListener('click', () => {
                    currentLinkElement = prevLink;
                    closeModal(true);
                    showOSModalForLink(prevLink);
                });
            } else btnPrev.disabled = true;

            const nextRow = currentRow ? currentRow.nextElementSibling : null;
            const nextLink = nextRow ? nextRow.querySelector('a[href*="retornarMapaOrdemDeServico"]') : null;
            if (nextLink) {
                btnNext.addEventListener('click', () => {
                    currentLinkElement = nextLink;
                    closeModal(true);
                    showOSModalForLink(nextLink);
                });
            } else btnNext.disabled = true;
        }

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
    } // Fim do if (atendimentopresencial)

    // (NOTA) A lógica 'else if' para 'atendimentoportelefone' foi removida
    // pois o script principal agora corre em ambas as páginas, e o botão
    // 'Editar Mapa' é simplesmente desabilitado na página 'telefone'.

})();
