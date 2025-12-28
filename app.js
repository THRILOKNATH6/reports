let mergedData = null;
let currentView = 'loaded'; // 'loaded', 'notloaded', 'cleared', 'partial', 'poview'
let rawExcelData = { order: null, load: null, pack: null }; // Store raw Excel data for error tracking
const SIZES = [
  "XXS", "XS", "S", "M", "L", "XL", "2XL",
  "LT", "XLT", "2XT", "3XT", "4XT", "5XT",
  "1X", "2X", "3X", "4X", "5X", "6X"
];

function readExcel(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => {
      const wb = XLSX.read(e.target.result, { type: "binary" });
      const sh = wb.Sheets[wb.SheetNames[0]];
      res(XLSX.utils.sheet_to_json(sh, { header: 1 }));
    };
    r.readAsBinaryString(file);
  });
}

function col(headers, name) {
  return headers.findIndex(h => String(h).trim().toUpperCase() === name);
}

function excelDateToJSDate(excelDate) {
  // Excel dates are days since 1900-01-01 (with 1900 incorrectly treated as leap year)
  if (!excelDate || isNaN(excelDate)) return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date;
}

function formatDate(excelDate) {
  const date = excelDateToJSDate(excelDate);
  if (!date) return 'Invalid Date';
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function normalize(data, mode) {
  const rows = [];
  const headers = data[0].map(h => String(h).trim().toUpperCase());

  const idx = {
    oc: col(headers, "OC"),
    style: col(headers, "STYLE"),
    po: col(headers, "PO NO"),
    country: col(headers, "COUNTRY"),
    colour: col(headers, "COLOUR"),
    line: col(headers, "LINE"),
    colourName: col(headers, "COLOUR NAME"),
    date: col(headers, "DATE")
  };

  const sizeIdx = {};
  SIZES.forEach(s => sizeIdx[s] = col(headers, s));

  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r || !r[idx.po]) continue;

    SIZES.forEach(s => {
      const ci = sizeIdx[s];
      if (ci === -1) return;
      const qty = Number(r[ci] || 0);
      if (!qty) return;

      rows.push({
        oc: r[idx.oc],
        style: r[idx.style],
        po: r[idx.po],
        country: r[idx.country],
        colour: r[idx.colour],
        line: mode === "LOAD" ? r[idx.line] : undefined,
        colourName: mode === "ORDER" ? r[idx.colourName] : undefined,
        loadDate: mode === "LOAD" && r[idx.date] ? formatDate(r[idx.date]) : undefined,
        packDate: mode === "PACK" && r[idx.date] ? formatDate(r[idx.date]) : undefined,
        size: s,
        order: mode === "ORDER" ? qty : 0,
        load: mode === "LOAD" ? qty : 0,
        pack: mode === "PACK" ? qty : 0,
        excelRow: i + 1, // Store Excel row number (1-indexed)
        excelColumn: s // Store size/column name
      });
    });
  }
  return rows;
}

function merge(order, load, pack) {
  const m = {};

  // Helper function to normalize key fields
  const normalizeKey = (oc, style, po, country, colour) => {
    const normalize = (val) => String(val || '').trim().toUpperCase();
    return `${normalize(oc)}|${normalize(style)}|${normalize(po)}|${normalize(country)}|${normalize(colour)}`;
  };

  let packMergeCount = 0;
  const orderKeys = new Set();
  const loadKeys = new Set();
  const packKeys = new Set();

  [...order, ...load, ...pack].forEach(r => {
    const k = normalizeKey(r.oc, r.style, r.po, r.country, r.colour);
    if (!m[k]) m[k] = { meta: r, order: {}, load: {}, pack: {}, loadDates: new Set(), packDates: new Set() };
    if (r.order) {
      m[k].order[r.size] = (m[k].order[r.size] || 0) + r.order;
      orderKeys.add(k);
    }
    if (r.load) {
      m[k].load[r.size] = (m[k].load[r.size] || 0) + r.load;
      if (r.line !== undefined) m[k].meta.line = r.line;
      if (r.loadDate !== undefined) m[k].loadDates.add(r.loadDate);
      loadKeys.add(k);
    }
    if (r.pack) {
      m[k].pack[r.size] = (m[k].pack[r.size] || 0) + r.pack;
      if (r.packDate !== undefined) m[k].packDates.add(r.packDate);
      packMergeCount++;
      packKeys.add(k);
    }
    if (r.colourName !== undefined) m[k].meta.colourName = r.colourName;
  });

  console.log(`Merge complete: ${Object.keys(m).length} unique blocks, ${packMergeCount} pack entries merged`);
  console.log(`Unique keys - Orders: ${orderKeys.size}, Loads: ${loadKeys.size}, Packs: ${packKeys.size}`);

  // Show sample keys from each type
  if (orderKeys.size > 0) console.log('Sample order key:', Array.from(orderKeys)[0]);
  if (loadKeys.size > 0) console.log('Sample load key:', Array.from(loadKeys)[0]);
  if (packKeys.size > 0) console.log('Sample pack key:', Array.from(packKeys)[0]);

  // Check how many blocks have all three types
  let blocksWithAll = 0;
  let blocksWithOrderLoad = 0;
  let blocksWithOrderPack = 0;
  let blocksWithLoadPack = 0;
  let blocksWithOnlyPack = 0;

  Object.values(m).forEach(block => {
    const hasOrder = Object.keys(block.order).length > 0;
    const hasLoad = Object.keys(block.load).length > 0;
    const hasPack = Object.keys(block.pack).length > 0;

    if (hasOrder && hasLoad && hasPack) blocksWithAll++;
    if (hasOrder && hasLoad && !hasPack) blocksWithOrderLoad++;
    if (hasOrder && !hasLoad && hasPack) blocksWithOrderPack++;
    if (!hasOrder && hasLoad && hasPack) blocksWithLoadPack++;
    if (!hasOrder && !hasLoad && hasPack) blocksWithOnlyPack++;
  });

  console.log(`Blocks with Order+Load+Pack: ${blocksWithAll}`);
  console.log(`Blocks with Order+Load only: ${blocksWithOrderLoad}`);
  console.log(`Blocks with Order+Pack only: ${blocksWithOrderPack}`);
  console.log(`Blocks with Load+Pack only: ${blocksWithLoadPack}`);
  console.log(`Blocks with Pack only: ${blocksWithOnlyPack}`);

  return m;
}

function totalLoad(block) {
  return Object.values(block.load).reduce((a, b) => a + b, 0);
}

function isLoadingCleared(block) {
  // Check if all sizes have load qty >= order qty (including extra loading)
  const sizes = SIZES.filter(s => block.order[s] || block.load[s]);
  if (sizes.length === 0) return false;

  for (let size of sizes) {
    const orderQty = block.order[size] || 0;
    const loadQty = block.load[size] || 0;
    if (loadQty < orderQty) return false; // Loading not complete for this size
  }
  return true;
}

function isPartiallyLoading(block) {
  // Check if some loading done but not complete
  const totalOrder = Object.values(block.order).reduce((a, b) => a + b, 0);
  const totalLoadQty = totalLoad(block);
  return totalLoadQty > 0 && totalLoadQty < totalOrder;
}

function isPackingCleared(block) {
  // Check if all sizes have pack qty >= order qty
  const sizes = SIZES.filter(s => block.order[s] || block.pack[s]);
  if (sizes.length === 0) return false;

  for (let size of sizes) {
    const orderQty = block.order[size] || 0;
    const packQty = block.pack[size] || 0;
    if (packQty < orderQty) return false;
  }
  return true;
}

function isPartiallyPacking(block) {
  // Check if some packing done but not complete
  const totalOrder = Object.values(block.order).reduce((a, b) => a + b, 0);
  const totalPackQty = Object.values(block.pack).reduce((a, b) => a + b, 0);
  return totalPackQty > 0 && totalPackQty < totalOrder;
}

function totalPack(block) {
  return Object.values(block.pack).reduce((a, b) => a + b, 0);
}

// Detect errors in a block (order qty = 0 but loading or packing > 0)
function detectErrors(block) {
  const errors = [];

  SIZES.forEach(size => {
    const orderQty = block.order[size] || 0;
    const loadQty = block.load[size] || 0;
    const packQty = block.pack[size] || 0;

    // Error: Order qty is 0 but loading qty > 0
    if (orderQty === 0 && loadQty > 0) {
      errors.push({
        type: 'loading',
        size: size,
        message: `Loading file has quantity ${loadQty} for size ${size}, but Order file has 0`,
        orderQty: orderQty,
        loadQty: loadQty,
        packQty: packQty
      });
    }

    // Error: Order qty is 0 but packing qty > 0
    if (orderQty === 0 && packQty > 0) {
      errors.push({
        type: 'packing',
        size: size,
        message: `Packing file has quantity ${packQty} for size ${size}, but Order file has 0`,
        orderQty: orderQty,
        loadQty: loadQty,
        packQty: packQty
      });
    }
  });

  return errors;
}

// Check which field values exist in the order file
function checkFieldsInOrderFile(block) {
  const fieldStatus = {
    oc: false,
    style: false,
    po: false,
    country: false,
    colour: false
  };

  // Check each field against all order file entries
  if (!mergedData) return fieldStatus;

  const normalize = (val) => String(val || '').trim().toUpperCase();
  const blockOC = normalize(block.meta.oc);
  const blockStyle = normalize(block.meta.style);
  const blockPO = normalize(block.meta.po);
  const blockCountry = normalize(block.meta.country);
  const blockColour = normalize(block.meta.colour);

  // Check if each individual field value exists in ANY order entry
  Object.values(mergedData).forEach(entry => {
    // Only check entries that have order quantities
    if (Object.keys(entry.order).length > 0) {
      if (normalize(entry.meta.oc) === blockOC) fieldStatus.oc = true;
      if (normalize(entry.meta.style) === blockStyle) fieldStatus.style = true;
      if (normalize(entry.meta.po) === blockPO) fieldStatus.po = true;
      if (normalize(entry.meta.country) === blockCountry) fieldStatus.country = true;
      if (normalize(entry.meta.colour) === blockColour) fieldStatus.colour = true;
    }
  });

  return fieldStatus;
}

// Show error popup
function showErrorPopup(block) {
  const errors = detectErrors(block);

  if (errors.length === 0) {
    alert('No errors found in this entry.');
    return;
  }

  // Determine which files have errors
  const hasLoadingErrors = errors.some(e => e.type === 'loading');
  const hasPackingErrors = errors.some(e => e.type === 'packing');

  // Get affected sizes
  const loadingSizes = errors.filter(e => e.type === 'loading').map(e => e.size);
  const packingSizes = errors.filter(e => e.type === 'packing').map(e => e.size);

  // Check which fields exist in order file
  const fieldStatus = checkFieldsInOrderFile(block);

  let errorHTML = `
    <div id="errorModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:10px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        
        <!-- Header with gradient -->
        <div style="background:linear-gradient(135deg, #dc3545 0%, #c82333 100%);padding:15px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:10px 10px 0 0;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">⚠️</span>
            <span style="color:white;font-weight:bold;font-size:16px;">Data Mismatch Detected</span>
          </div>
          <button onclick="closeErrorModal()" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:18px;font-weight:bold;transition:background 0.3s;">✕</button>
        </div>
        
        <!-- Error Type Badges -->
        <div style="padding:15px 20px;background:#fff3cd;border-bottom:1px solid #ffc107;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${hasLoadingErrors ? '<span style="background:#ffc107;color:#000;padding:5px 12px;border-radius:4px;font-size:12px;font-weight:bold;">LOADING FILE ERROR</span>' : ''}
            ${hasPackingErrors ? '<span style="background:#dc3545;color:white;padding:5px 12px;border-radius:4px;font-size:12px;font-weight:bold;">PACKING FILE ERROR</span>' : ''}
            <span style="color:#856404;font-size:13px;margin-left:auto;font-weight:600;">${loadingSizes.length + packingSizes.length} size(s) affected</span>
          </div>
        </div>
        
        <!-- Block Details - Inline Grid with color coding -->
        <div style="padding:15px 20px;background:#f8f9fa;">
          <p style="margin:0 0 10px 0;font-weight:bold;color:#333;font-size:13px;">Field Values (🟢 = Found in Order File, 🔴 = Not Found):</p>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 15px;font-size:13px;">
            <span style="font-weight:bold;color:#666;">OC:</span>
            <span style="color:${fieldStatus.oc ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.oc ? '🟢' : '🔴'} ${block.meta.oc}</span>
            
            <span style="font-weight:bold;color:#666;">Style:</span>
            <span style="color:${fieldStatus.style ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.style ? '🟢' : '🔴'} ${block.meta.style}</span>
            
            <span style="font-weight:bold;color:#666;">PO:</span>
            <span style="color:${fieldStatus.po ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.po ? '🟢' : '🔴'} ${block.meta.po}</span>
            
            <span style="font-weight:bold;color:#666;">Country:</span>
            <span style="color:${fieldStatus.country ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.country ? '🟢' : '🔴'} ${block.meta.country}</span>
            
            <span style="font-weight:bold;color:#666;">Colour:</span>
            <span style="color:${fieldStatus.colour ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.colour ? '🟢' : '🔴'} ${block.meta.colour}</span>
          </div>
        </div>
        
        <!-- Sizes with Errors and Quantities -->
        <div style="padding:15px 20px;background:white;border-top:1px solid #dee2e6;">
          <p style="margin:0 0 10px 0;font-weight:bold;color:#333;font-size:13px;">Affected Sizes & Quantities:</p>
  `;

  // Show sizes with quantities
  errorHTML += `<div style="font-size:12px;color:#666;line-height:1.6;">`;

  if (hasLoadingErrors) {
    const loadingDetails = errors.filter(e => e.type === 'loading').map(e => `${e.size} (${e.loadQty})`).join(', ');
    errorHTML += `<div style="margin-bottom:8px;padding:8px;background:#fff3cd;border-radius:4px;"><strong style="color:#856404;">Loading File:</strong> ${loadingDetails}</div>`;
  }

  if (hasPackingErrors) {
    const packingDetails = errors.filter(e => e.type === 'packing').map(e => `${e.size} (${e.packQty})`).join(', ');
    errorHTML += `<div style="padding:8px;background:#f8d7da;border-radius:4px;"><strong style="color:#721c24;">Packing File:</strong> ${packingDetails}</div>`;
  }

  errorHTML += `</div>
        </div>`;

  errorHTML += `
        
        <!-- Action Note -->
        <div style="padding:15px 20px;background:#e7f3ff;border-top:1px solid #b3d9ff;">
          <p style="margin:0;font-size:12px;color:#004085;line-height:1.6;">
            <strong>💡 Action:</strong> This combination doesn't exist in the Order file. Verify the highlighted values in the ${hasLoadingErrors && hasPackingErrors ? 'Loading and Packing files' : hasLoadingErrors ? 'Loading file' : 'Packing file'}.
          </p>
        </div>
        
        <!-- Close Button -->
        <div style="padding:15px 20px;text-align:center;background:white;border-radius:0 0 10px 10px;">
          <button onclick="closeErrorModal()" style="background:#007bff;color:white;border:none;padding:10px 30px;border-radius:5px;cursor:pointer;font-size:14px;font-weight:bold;transition:background 0.3s;">Close</button>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('errorModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', errorHTML);
}

// Close error modal
function closeErrorModal() {
  const modal = document.getElementById('errorModal');
  if (modal) {
    modal.remove();
  }
}

// Helper function to show error popup by block key
function showErrorPopupByKey(blockKey) {
  if (!mergedData || !mergedData[blockKey]) {
    alert('Block not found');
    return;
  }
  showErrorPopup(mergedData[blockKey]);
}

// Show all errors from all blocks
function showAllErrors() {
  if (!mergedData) {
    alert('No data loaded');
    return;
  }

  // Collect all errors from all blocks
  const allErrors = [];
  Object.values(mergedData).forEach(block => {
    const errors = detectErrors(block);
    if (errors.length > 0) {
      allErrors.push({
        block: block,
        errors: errors
      });
    }
  });

  if (allErrors.length === 0) {
    alert('No errors found in the data!');
    return;
  }

  // Build the popup HTML
  let errorHTML = `
    <div id="errorModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px;">
      <div style="background:white;padding:30px;border-radius:12px;max-width:900px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;border-bottom:3px solid #dc3545;padding-bottom:15px;position:sticky;top:0;background:white;z-index:1;">
          <h2 style="margin:0;color:#dc3545;font-size:28px;">
            <span style="font-size:32px;">⚠️</span> All Data Errors
          </h2>
          <button onclick="closeErrorModal()" style="background:#dc3545;color:white;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;font-size:18px;font-weight:bold;transition:background 0.3s;">✕</button>
        </div>
        
        <div style="background:#fff3cd;padding:15px;border-radius:8px;margin-bottom:20px;border-left:4px solid #ffc107;">
          <p style="margin:0;font-weight:bold;color:#856404;">
            📊 Summary: Found ${allErrors.length} block(s) with errors
          </p>
        </div>
  `;

  // Add each block's errors
  allErrors.forEach((item, blockIndex) => {
    const block = item.block;
    const errors = item.errors;

    // Determine which files have errors
    const hasLoadingErrors = errors.some(e => e.type === 'loading');
    const hasPackingErrors = errors.some(e => e.type === 'packing');

    // Get affected sizes
    const loadingSizes = errors.filter(e => e.type === 'loading').map(e => e.size);
    const packingSizes = errors.filter(e => e.type === 'packing').map(e => e.size);

    // Check which fields exist in order file
    const fieldStatus = checkFieldsInOrderFile(block);

    errorHTML += `
      <div style="background:white;border-radius:8px;margin-bottom:15px;border:2px solid #dc3545;box-shadow:0 2px 8px rgba(220,53,69,0.15);overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg, #dc3545 0%, #c82333 100%);padding:12px 15px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">❌</span>
            <span style="color:white;font-weight:bold;font-size:14px;">Block ${blockIndex + 1} - Incorrect Data in ${hasLoadingErrors && hasPackingErrors ? 'Loading & Packing Files' : hasLoadingErrors ? 'Loading File' : 'Packing File'}</span>
          </div>
        </div>
        
        <!-- Error Type Badge -->
        <div style="padding:12px 15px;background:#fff3cd;border-bottom:1px solid #ffc107;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            ${hasLoadingErrors ? '<span style="background:#ffc107;color:#000;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:bold;">LOADING FILE ERROR</span>' : ''}
            ${hasPackingErrors ? '<span style="background:#dc3545;color:white;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:bold;">PACKING FILE ERROR</span>' : ''}
            <span style="color:#856404;font-size:12px;margin-left:auto;">${loadingSizes.length + packingSizes.length} size(s) affected</span>
          </div>
        </div>
        
        <!-- Block Details - Inline with color coding -->
        <div style="padding:12px 15px;background:#f8f9fa;">
          <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 15px;font-size:13px;">
            <span style="font-weight:bold;color:#666;">OC:</span>
            <span style="color:${fieldStatus.oc ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.oc ? '🟢' : '🔴'} ${block.meta.oc}</span>
            
            <span style="font-weight:bold;color:#666;">Style:</span>
            <span style="color:${fieldStatus.style ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.style ? '🟢' : '🔴'} ${block.meta.style}</span>
            
            <span style="font-weight:bold;color:#666;">PO:</span>
            <span style="color:${fieldStatus.po ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.po ? '🟢' : '🔴'} ${block.meta.po}</span>
            
            <span style="font-weight:bold;color:#666;">Country:</span>
            <span style="color:${fieldStatus.country ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.country ? '🟢' : '🔴'} ${block.meta.country}</span>
            
            <span style="font-weight:bold;color:#666;">Colour:</span>
            <span style="color:${fieldStatus.colour ? '#28a745' : '#dc3545'};font-weight:bold;">${fieldStatus.colour ? '🟢' : '🔴'} ${block.meta.colour}</span>
          </div>
        </div>
        
        <!-- Sizes Info with Quantities -->
        <div style="padding:10px 15px;background:white;border-top:1px solid #dee2e6;">
          <div style="font-size:12px;color:#666;">
            ${hasLoadingErrors ? `<div style="margin-bottom:5px;"><strong style="color:#856404;">Loading:</strong> ${errors.filter(e => e.type === 'loading').map(e => `${e.size} (${e.loadQty})`).join(', ')}</div>` : ''}
            ${hasPackingErrors ? `<div><strong style="color:#721c24;">Packing:</strong> ${errors.filter(e => e.type === 'packing').map(e => `${e.size} (${e.packQty})`).join(', ')}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  errorHTML += `
        <div style="background:#e7f3ff;padding:15px;border-radius:8px;border-left:4px solid #007bff;margin-top:20px;">
          <p style="margin:0;font-size:14px;color:#004085;line-height:1.6;">
            <strong>💡 Action Required:</strong> The highlighted combinations (OC, Style, PO, Country, Colour) exist in the Loading/Packing files but do NOT exist in the Order file. 
            One or more of these values is incorrect. Please verify and correct the Excel file(s).
          </p>
        </div>
        
        <div style="text-align:center;margin-top:25px;">
          <button onclick="closeErrorModal()" style="background:#007bff;color:white;border:none;padding:14px 40px;border-radius:6px;cursor:pointer;font-size:16px;font-weight:bold;transition:background 0.3s;">Close</button>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('errorModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', errorHTML);
}

// Update alerts button visibility and count
function updateAlertsButton() {
  if (!mergedData) {
    document.getElementById('alertsButton').style.display = 'none';
    return;
  }

  // Count total errors
  let totalErrors = 0;
  let blocksWithErrors = 0;

  Object.values(mergedData).forEach(block => {
    const errors = detectErrors(block);
    if (errors.length > 0) {
      totalErrors += errors.length;
      blocksWithErrors++;
    }
  });

  const alertsButton = document.getElementById('alertsButton');
  const alertsCount = document.getElementById('alertsCount');

  if (totalErrors > 0) {
    alertsButton.style.display = 'block';
    alertsCount.textContent = totalErrors;
    alertsButton.title = `${blocksWithErrors} block(s) with ${totalErrors} error(s) - Click to view details`;
  } else {
    alertsButton.style.display = 'none';
  }
}


function render(b) {
  const sizes = SIZES.filter(s => b.order[s] || b.load[s] || b.pack[s]);
  const lineInfo = b.meta.line !== undefined ? ` | LINE: ${b.meta.line}` : '';
  const colourNameInfo = b.meta.colourName !== undefined ? ` | Colour Name: ${b.meta.colourName}` : '';

  // Debug: Log pack data for first block
  if (!window.debuggedFirstBlock) {
    console.log('First block pack data:', b.pack);
    console.log('First block meta:', b.meta);
    window.debuggedFirstBlock = true;
  }

  // Check for errors
  const errors = detectErrors(b);
  const hasErrors = errors.length > 0;
  const blockId = `block_${b.meta.oc}_${b.meta.style}_${b.meta.po}_${b.meta.country}_${b.meta.colour}`.replace(/[^a-zA-Z0-9_]/g, '_');

  // Create a normalized key for the block
  const normalizeKey = (val) => String(val || '').trim().toUpperCase();
  const blockKey = `${normalizeKey(b.meta.oc)}|${normalizeKey(b.meta.style)}|${normalizeKey(b.meta.po)}|${normalizeKey(b.meta.country)}|${normalizeKey(b.meta.colour)}`;

  let h = `<div class="block" id="${blockId}" style="${hasErrors ? 'border: 2px solid #dc3545; position: relative;' : ''}">`;

  // Add error alert icon if errors exist
  if (hasErrors) {
    h += `
      <div style="position:absolute;top:10px;right:10px;cursor:pointer" onclick="showErrorPopupByKey('${blockKey}')" title="Click to view errors">
        <span style="font-size:32px;color:#dc3545;animation:pulse 2s infinite">⚠️</span>
        <span style="background:#dc3545;color:white;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:bold;margin-left:5px">${errors.length}</span>
      </div>
    `;
  }

  h += `<b>${b.meta.oc} | ${b.meta.style} | ${b.meta.po} | ${b.meta.country} | ${b.meta.colour}${lineInfo}${colourNameInfo}</b>`;
  h += "<table><tr><th>TYPE</th>";
  [...sizes, "TOTAL"].forEach(s => h += `<th>${s}</th>`);
  h += "</tr>";

  const rows = [
    { label: "ORDER QTY", calc: s => ({ v: b.order[s] || 0 }) },
    { label: "LOAD QTY", calc: s => ({ v: b.load[s] || 0 }) },
    {
      label: "BALANCE TO LOAD", calc: s => {
        const diff = (b.order[s] || 0) - (b.load[s] || 0);
        if (diff > 0) return { v: -Math.abs(diff), cls: "neg" };
        if (diff < 0) return { v: Math.abs(diff), cls: "pos" };
        return { v: 0 };
      }
    },
    { label: "PACK QTY", calc: s => ({ v: b.pack[s] || 0 }) },
    {
      label: "BALANCE TO PACK", calc: s => {
        const diff = (b.order[s] || 0) - (b.pack[s] || 0);
        if (diff > 0) return { v: -Math.abs(diff), cls: "neg" };
        if (diff < 0) return { v: Math.abs(diff), cls: "pos" };
        return { v: 0 };
      }
    }
  ];

  rows.forEach(r => {
    let tot = 0;
    h += `<tr><td>${r.label}</td>`;
    sizes.forEach(s => {
      const obj = r.calc(s);
      const v = obj.v || 0;
      tot += v;
      const cls = obj.cls ? `class='${obj.cls}'` : "";
      h += `<td ${cls}>${v}</td>`;
    });
    h += `<td>${tot}</td></tr>`;
  });

  h += "</table></div>";
  return h;
}

async function process() {
  const of = document.getElementById("orderFile").files[0];
  const lf = document.getElementById("loadFile").files[0];
  const pf = document.getElementById("packFile").files[0];
  if (!of || !lf || !pf) { alert("Upload all 3 files"); return; }

  const orderRaw = await readExcel(of);
  const loadRaw = await readExcel(lf);
  const packRaw = await readExcel(pf);

  const orders = normalize(orderRaw, "ORDER");
  const loads = normalize(loadRaw, "LOAD");
  const packs = normalize(packRaw, "PACK");

  console.log(`Normalized: ${orders.length} order records, ${loads.length} load records, ${packs.length} pack records`);

  mergedData = merge(orders, loads, packs);

  // Save to localStorage for persistence (for this page and daily summary page)
  try {
    localStorage.setItem('orderComparisonData', JSON.stringify({
      mergedData: mergedData,
      timestamp: new Date().toISOString()
    }));

    // Save raw Excel data for daily summary page
    localStorage.setItem('sharedExcelData', JSON.stringify({
      loadData: loadRaw,
      packData: packRaw,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }

  const out = document.getElementById("output");
  out.innerHTML = "";

  currentView = 'loaded';
  populateFilters();
  calculateSummary();
  calculateMasterSummary();  // Calculate and display master summary
  document.getElementById('filterSection').style.display = 'none';  // Hide filters by default
  document.getElementById('dataStatusMessage').style.display = 'none';  // Hide status message for new uploads
  applyFilters();
  updateAlertsButton();  // Update alerts button with error count
}

// Load data from localStorage on page load
function loadFromLocalStorage() {
  try {
    // First check if we have raw Excel data to re-process with updated logic
    const sharedExcelData = localStorage.getItem('sharedExcelData');
    const savedData = localStorage.getItem('orderComparisonData');

    if (sharedExcelData && savedData) {
      const excelParsed = JSON.parse(sharedExcelData);
      const dataParsed = JSON.parse(savedData);

      // Check if we have all three data types in the old merged data
      const oldMerged = dataParsed.mergedData;
      const hasOrderData = Object.values(oldMerged).some(b => Object.keys(b.order).length > 0);
      const hasLoadData = excelParsed.loadData && excelParsed.loadData.length > 0;
      const hasPackData = excelParsed.packData && excelParsed.packData.length > 0;

      if (hasOrderData && hasLoadData && hasPackData) {
        console.log('Re-processing data with updated merge logic...');

        // Extract order data from old merged data
        const orders = [];
        Object.values(oldMerged).forEach(block => {
          Object.keys(block.order).forEach(size => {
            if (block.order[size] > 0) {
              orders.push({
                oc: block.meta.oc,
                style: block.meta.style,
                po: block.meta.po,
                country: block.meta.country,
                colour: block.meta.colour,
                colourName: block.meta.colourName,
                size: size,
                order: block.order[size],
                load: 0,
                pack: 0
              });
            }
          });
        });

        // Re-normalize load and pack data
        const loads = normalize(excelParsed.loadData, "LOAD");
        const packs = normalize(excelParsed.packData, "PACK");

        console.log(`Re-processing: ${orders.length} order records, ${loads.length} load records, ${packs.length} pack records`);

        // Re-merge with new logic
        mergedData = merge(orders, loads, packs);

        // Save the re-processed data
        localStorage.setItem('orderComparisonData', JSON.stringify({
          mergedData: mergedData,
          timestamp: new Date().toISOString()
        }));

        // Restore the view
        currentView = 'loaded';
        populateFilters();
        calculateSummary();
        calculateMasterSummary();
        document.getElementById('filterSection').style.display = 'none';
        applyFilters();
        updateAlertsButton();  // Update alerts button

        // Show status message
        const statusMsg = document.getElementById('dataStatusMessage');
        const timestampSpan = document.getElementById('dataTimestamp');
        if (statusMsg && timestampSpan) {
          timestampSpan.textContent = `(Re-processed with updated logic)`;
          statusMsg.style.display = 'block';
        }

        console.log('Data re-processed successfully');
        return true;
      }
    }

    // Fallback to old method if raw data not available
    if (savedData) {
      const parsed = JSON.parse(savedData);
      mergedData = parsed.mergedData;

      // Restore the view
      currentView = 'loaded';
      populateFilters();
      calculateSummary();
      calculateMasterSummary();
      document.getElementById('filterSection').style.display = 'none';
      applyFilters();
      updateAlertsButton();  // Update alerts button

      // Show status message
      const statusMsg = document.getElementById('dataStatusMessage');
      const timestampSpan = document.getElementById('dataTimestamp');
      if (statusMsg && timestampSpan) {
        const savedDate = new Date(parsed.timestamp);
        timestampSpan.textContent = `(Saved: ${savedDate.toLocaleString()})`;
        statusMsg.style.display = 'block';
      }

      console.log('Data loaded from localStorage (saved at:', parsed.timestamp + ')');
      return true;
    }
  } catch (e) {
    console.warn('Could not load from localStorage:', e);
  }
  return false;
}

// Clear loaded data
function clearLoadedData() {
  if (confirm('Are you sure you want to clear all loaded data? This will remove the uploaded files and reset the page.')) {
    // Clear localStorage
    localStorage.removeItem('orderComparisonData');

    // Clear in-memory data
    mergedData = null;
    currentView = 'loaded';

    // Clear file inputs
    document.getElementById("orderFile").value = '';
    document.getElementById("loadFile").value = '';
    document.getElementById("packFile").value = '';

    // Clear all sections
    document.getElementById('output').innerHTML = '';
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('masterSummarySection').style.display = 'none';
    document.getElementById('styleDetailsSection').style.display = 'none';
    document.getElementById('filterSection').style.display = 'none';
    document.getElementById('dataStatusMessage').style.display = 'none';

    alert('All data has been cleared successfully!');
  }
}

// Auto-load data on page load
window.addEventListener('DOMContentLoaded', function () {
  loadFromLocalStorage();
});


function populateFilters() {
  if (!mergedData) return;

  const ocs = new Set();
  const styles = new Set();
  const colours = new Set();
  const pos = new Set();

  Object.values(mergedData).forEach(b => {
    if (b.meta.oc) ocs.add(b.meta.oc);
    if (b.meta.style) styles.add(b.meta.style);
    if (b.meta.colour) colours.add(b.meta.colour);
    if (b.meta.po) pos.add(b.meta.po);
  });

  const ocFilter = document.getElementById('ocFilter');
  const styleFilter = document.getElementById('styleFilter');
  const colourFilter = document.getElementById('colourFilter');
  const poFilter = document.getElementById('poFilter');

  ocFilter.innerHTML = '<option value="ALL" selected>-- All --</option>';
  styleFilter.innerHTML = '<option value="ALL" selected>-- All --</option>';
  colourFilter.innerHTML = '<option value="ALL" selected>-- All --</option>';
  poFilter.innerHTML = '<option value="ALL" selected>-- All --</option>';

  Array.from(ocs).sort().forEach(oc => {
    ocFilter.innerHTML += `<option value="${oc}">${oc}</option>`;
  });

  Array.from(styles).sort().forEach(style => {
    styleFilter.innerHTML += `<option value="${style}">${style}</option>`;
  });

  Array.from(colours).sort().forEach(colour => {
    colourFilter.innerHTML += `<option value="${colour}">${colour}</option>`;
  });

  Array.from(pos).sort().forEach(po => {
    poFilter.innerHTML += `<option value="${po}">${po}</option>`;
  });

  document.getElementById('filterSection').style.display = 'none';  // Keep filters hidden
}

function calculateSummary() {
  if (!mergedData) return;

  if (currentView === 'poview') {
    calculatePOSummary();
    return;
  }

  let loadedCount = 0;
  let notLoadedCount = 0;
  let loadingClearedCount = 0;
  let partialLoadingCount = 0;
  let packingClearedCount = 0;
  let partialPackingCount = 0;
  let loadingClearedButNotPackingCount = 0;

  Object.values(mergedData).forEach(b => {
    const totalLoadQty = totalLoad(b);
    const isLoadCleared = isLoadingCleared(b);
    const isPackCleared = isPackingCleared(b);

    if (totalLoadQty > 0) loadedCount++;
    if (totalLoadQty === 0) notLoadedCount++;
    if (isLoadCleared) loadingClearedCount++;
    if (isPartiallyLoading(b)) partialLoadingCount++;
    if (isPackCleared) packingClearedCount++;
    if (isPartiallyPacking(b)) partialPackingCount++;

    // Loading cleared but not packing (IMPORTANT!)
    if (isLoadCleared && !isPackCleared) loadingClearedButNotPackingCount++;
  });

  const summaryContent = document.getElementById('summaryContent');
  summaryContent.innerHTML = `
    <div class="summary-card loaded" onclick="showLoadedFromSummary()">
      <h4>Loaded Orders</h4>
      <p class="count">${loadedCount}</p>
    </div>
    <div class="summary-card notloaded" onclick="showNotLoadedFromSummary()">
      <h4>Not Loaded</h4>
      <p class="count">${notLoadedCount}</p>
    </div>
    <div class="summary-card cleared" onclick="showLoadingClearedFromSummary()">
      <h4>Loading Cleared</h4>
      <p class="count">${loadingClearedCount}</p>
    </div>
    <div class="summary-card partial" onclick="showPartiallyLoadingFromSummary()">
      <h4>Partially Loading</h4>
      <p class="count">${partialLoadingCount}</p>
    </div>
    <div class="summary-card" style="border-left-color:#28a745" onclick="showPackingClearedFromSummary()">
      <h4>All Packing Clear</h4>
      <p class="count">${packingClearedCount}</p>
    </div>
    <div class="summary-card" style="border-left-color:#ffc107" onclick="showPartialPackingFromSummary()">
      <h4>Partial Packing</h4>
      <p class="count">${partialPackingCount}</p>
    </div>
    <div class="summary-card" style="border-left-color:#dc3545" onclick="showLoadingClearedButNotPackingFromSummary()">
      <h4>Loading Clear but Not Packing</h4>
      <p class="count">${loadingClearedButNotPackingCount}</p>
    </div>
  `;

  document.getElementById('summarySection').style.display = 'block';
}

function calculatePOSummary() {
  if (!mergedData) return;

  // Group by PO (only include orders with loading > 0)
  const poGroups = {};
  Object.values(mergedData).forEach(b => {
    if (totalLoad(b) > 0) {
      const po = b.meta.po;
      if (!poGroups[po]) poGroups[po] = [];
      poGroups[po].push(b);
    }
  });

  let totalPOs = Object.keys(poGroups).length;
  let allLoadingClearedPOs = 0;
  let allPackingClearedPOs = 0;
  let partialLoadingPOs = 0;

  Object.values(poGroups).forEach(orders => {
    const allLoadingCleared = orders.every(b => isLoadingCleared(b));
    const allPackingCleared = orders.every(b => isPackingCleared(b));
    const hasPartial = orders.some(b => isPartiallyLoading(b));

    if (allLoadingCleared) allLoadingClearedPOs++;
    if (allPackingCleared) allPackingClearedPOs++;
    if (hasPartial) partialLoadingPOs++;
  });

  const summaryContent = document.getElementById('summaryContent');
  summaryContent.innerHTML = `
    <div class="summary-card loaded" onclick="showPOView()">
      <h4>Total POs</h4>
      <p class="count">${totalPOs}</p>
    </div>
    <div class="summary-card cleared" onclick="showPOLoadingClearedFromSummary()">
      <h4>All Loading Cleared</h4>
      <p class="count">${allLoadingClearedPOs}</p>
    </div>
    <div class="summary-card" style="border-left-color:#007bff" onclick="showPOPackingClearedFromSummary()">
      <h4>All Packing Cleared</h4>
      <p class="count">${allPackingClearedPOs}</p>
    </div>
    <div class="summary-card partial" onclick="showPOPartialFromSummary()">
      <h4>Has Partial Loading</h4>
      <p class="count">${partialLoadingPOs}</p>
    </div>
  `;

  document.getElementById('summarySection').style.display = 'block';
}

function applyFilters() {
  if (!mergedData) return;

  if (currentView === 'poview') {
    renderPOView();
    return;
  }

  if (currentView === 'ocview') {
    renderOCView();
    return;
  }

  // Show consolidated table for all views
  generateConsolidatedTableFiltered();
}

function clearFilters() {
  const ocFilter = document.getElementById('ocFilter');
  const styleFilter = document.getElementById('styleFilter');
  const colourFilter = document.getElementById('colourFilter');
  const poFilter = document.getElementById('poFilter');

  // Clear search boxes
  document.getElementById('ocSearch').value = '';
  document.getElementById('styleSearch').value = '';
  document.getElementById('colourSearch').value = '';
  document.getElementById('poSearch').value = '';

  // Show all options
  Array.from(ocFilter.options).forEach(opt => opt.style.display = '');
  Array.from(styleFilter.options).forEach(opt => opt.style.display = '');
  Array.from(colourFilter.options).forEach(opt => opt.style.display = '');
  Array.from(poFilter.options).forEach(opt => opt.style.display = '');

  // Select only 'ALL' option
  Array.from(ocFilter.options).forEach(opt => opt.selected = opt.value === 'ALL');
  Array.from(styleFilter.options).forEach(opt => opt.selected = opt.value === 'ALL');
  Array.from(colourFilter.options).forEach(opt => opt.selected = opt.value === 'ALL');
  Array.from(poFilter.options).forEach(opt => opt.selected = opt.value === 'ALL');

  applyFilters();
}

function searchFilter(type) {
  const searchId = type + 'Search';
  const filterId = type + 'Filter';

  const searchInput = document.getElementById(searchId);
  const filterSelect = document.getElementById(filterId);
  const searchTerm = searchInput.value.toUpperCase();

  Array.from(filterSelect.options).forEach(option => {
    if (option.value === 'ALL') {
      option.style.display = ''; // Always show 'All' option
      return;
    }

    const optionText = option.text.toUpperCase();
    if (optionText.includes(searchTerm)) {
      option.style.display = '';
    } else {
      option.style.display = 'none';
      // Deselect hidden options
      if (option.selected) {
        option.selected = false;
      }
    }
  });
}

function showNotLoaded() {
  if (!mergedData) {
    alert("Please upload and compare files first!");
    return;
  }

  currentView = 'notloaded';
  clearFilters();
  applyFilters();
}

function showLoadingCleared() {
  if (!mergedData) {
    alert("Please upload and compare files first!");
    return;
  }

  currentView = 'cleared';
  clearFilters();
  applyFilters();
}

function showPartiallyLoading() {
  if (!mergedData) {
    alert("Please upload and compare files first!");
    return;
  }

  currentView = 'partial';
  clearFilters();
  applyFilters();
}

function toggleFilters() {
  const filterSection = document.getElementById('filterSection');
  if (filterSection.style.display === 'none') {
    filterSection.style.display = 'block';
  } else {
    filterSection.style.display = 'none';
  }
}

// Summary card click handlers for regular view
function showLoadedFromSummary() {
  currentView = 'loaded';
  const mergedTableBtnContainer = document.getElementById('mergedTableBtnContainer');
  if (mergedTableBtnContainer) mergedTableBtnContainer.style.display = 'none';
  applyFilters();
}

function showNotLoadedFromSummary() {
  showNotLoaded();
}

function showLoadingClearedFromSummary() {
  showLoadingCleared();
}

function showPartiallyLoadingFromSummary() {
  showPartiallyLoading();
}

function showPackingClearedFromSummary() {
  if (!mergedData) {
    alert("Please upload and compare files first!");
    return;
  }

  currentView = 'packingcleared';
  const mergedTableBtnContainer = document.getElementById('mergedTableBtnContainer');
  if (mergedTableBtnContainer) mergedTableBtnContainer.style.display = 'none';
  clearFilters();
  applyFilters();
}

function showPartialPackingFromSummary() {
  if (!mergedData) {
    alert("Please upload and compare files first!");
    return;
  }

  currentView = 'partialpacking';
  const mergedTableBtnContainer = document.getElementById('mergedTableBtnContainer');
  if (mergedTableBtnContainer) mergedTableBtnContainer.style.display = 'none';
  clearFilters();
  applyFilters();
}

function showLoadingClearedButNotPackingFromSummary() {
  if (!mergedData) {
    alert("Please upload and compare files first!");
    return;
  }

  currentView = 'loadingclearednotpacking';
  const mergedTableBtnContainer = document.getElementById('mergedTableBtnContainer');
  if (mergedTableBtnContainer) mergedTableBtnContainer.style.display = 'none';
  clearFilters();
  applyFilters();
}


// Summary card click handlers for PO view
function showPOLoadingClearedFromSummary() {
  const out = document.getElementById('output');
  out.innerHTML = '';

  const poGroups = {};
  Object.values(mergedData).forEach(b => {
    if (totalLoad(b) > 0) {
      const po = b.meta.po;
      if (!poGroups[po]) poGroups[po] = [];
      poGroups[po].push(b);
    }
  });

  Object.keys(poGroups).sort().forEach(po => {
    const orders = poGroups[po];
    const allLoadingCleared = orders.every(b => isLoadingCleared(b));

    if (allLoadingCleared) {
      renderPOSection(po, orders);
    }
  });

  if (out.innerHTML === '') {
    out.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px">No POs with all loading cleared.</p>';
  }
}

function showPOPackingClearedFromSummary() {
  const out = document.getElementById('output');
  out.innerHTML = '';

  const poGroups = {};
  Object.values(mergedData).forEach(b => {
    if (totalLoad(b) > 0) {
      const po = b.meta.po;
      if (!poGroups[po]) poGroups[po] = [];
      poGroups[po].push(b);
    }
  });

  Object.keys(poGroups).sort().forEach(po => {
    const orders = poGroups[po];
    const allPackingCleared = orders.every(b => isPackingCleared(b));

    if (allPackingCleared) {
      renderPOSection(po, orders);
    }
  });

  if (out.innerHTML === '') {
    out.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px">No POs with all packing cleared.</p>';
  }
}

function showPOPartialFromSummary() {
  const out = document.getElementById('output');
  out.innerHTML = '';

  const poGroups = {};
  Object.values(mergedData).forEach(b => {
    if (totalLoad(b) > 0) {
      const po = b.meta.po;
      if (!poGroups[po]) poGroups[po] = [];
      poGroups[po].push(b);
    }
  });

  Object.keys(poGroups).sort().forEach(po => {
    const orders = poGroups[po];
    const hasPartial = orders.some(b => isPartiallyLoading(b));

    if (hasPartial) {
      renderPOSection(po, orders);
    }
  });

  if (out.innerHTML === '') {
    out.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px">No POs with partial loading.</p>';
  }
}

function renderPOSection(po, orders) {
  const allLoadingCleared = orders.every(b => isLoadingCleared(b));
  const allPackingCleared = orders.every(b => isPackingCleared(b));

  let html = `<div class="po-section">`;
  html += `<div class="po-header">PO: ${po}`;

  if (allLoadingCleared) {
    html += `<span class="po-badge loading-cleared">All Loading Clear</span>`;
  }
  if (allPackingCleared) {
    html += `<span class="po-badge packing-cleared">All Packing Clear</span>`;
  }

  html += `</div>`;

  orders.forEach(b => {
    const loadingClear = isLoadingCleared(b);
    const packingClear = isPackingCleared(b);

    let itemClass = 'order-item';
    if (loadingClear && packingClear) {
      itemClass += ' both-clear';
    } else if (loadingClear) {
      itemClass += ' loading-clear';
    } else if (packingClear) {
      itemClass += ' packing-clear';
    }

    html += `<div class="${itemClass}">`;
    html += render(b);
    html += `</div>`;
  });

  html += `</div>`;
  document.getElementById('output').innerHTML += html;
}

function showPOView() {
  if (!mergedData) {
    alert("Please upload and compare files first!");
    return;
  }

  currentView = 'poview';
  calculatePOSummary();
  clearFilters();
  applyFilters();

  // Show the merged table button in PO view
  const mergedTableBtnContainer = document.getElementById('mergedTableBtnContainer');
  if (mergedTableBtnContainer) mergedTableBtnContainer.style.display = 'block';
}

function renderPOView() {
  const out = document.getElementById('output');
  out.innerHTML = '';

  // Get filter selections
  const ocFilter = document.getElementById('ocFilter');
  const styleFilter = document.getElementById('styleFilter');
  const colourFilter = document.getElementById('colourFilter');
  const poFilter = document.getElementById('poFilter');

  const selectedOCs = Array.from(ocFilter.selectedOptions).map(o => o.value);
  const selectedStyles = Array.from(styleFilter.selectedOptions).map(o => o.value);
  const selectedColours = Array.from(colourFilter.selectedOptions).map(o => o.value);
  const selectedPOs = Array.from(poFilter.selectedOptions).map(o => o.value);

  // Group by PO (only include orders with loading > 0 and matching filters)
  const poGroups = {};
  Object.values(mergedData).forEach(b => {
    if (totalLoad(b) > 0) {  // Only include if loading exists
      // Apply filters
      const matchesOC = selectedOCs.includes('ALL') || selectedOCs.includes(String(b.meta.oc));
      const matchesStyle = selectedStyles.includes('ALL') || selectedStyles.includes(String(b.meta.style));
      const matchesColour = selectedColours.includes('ALL') || selectedColours.includes(String(b.meta.colour));
      const matchesPO = selectedPOs.includes('ALL') || selectedPOs.includes(String(b.meta.po));

      if (matchesOC && matchesStyle && matchesColour && matchesPO) {
        const po = b.meta.po;
        if (!poGroups[po]) poGroups[po] = [];
        poGroups[po].push(b);
      }
    }
  });

  // Render each PO group
  Object.keys(poGroups).sort().forEach(po => {
    const orders = poGroups[po];

    // Check if all orders in this PO are loading cleared
    const allLoadingCleared = orders.every(b => isLoadingCleared(b));
    const allPackingCleared = orders.every(b => isPackingCleared(b));

    let html = `<div class="po-section">`;
    html += `<div class="po-header">PO: ${po}`;

    if (allLoadingCleared) {
      html += `<span class="po-badge loading-cleared">All Loading Clear</span>`;
    }
    if (allPackingCleared) {
      html += `<span class="po-badge packing-cleared">All Packing Clear</span>`;
    }

    html += `</div>`;

    // Render each order in this PO
    orders.forEach(b => {
      const loadingClear = isLoadingCleared(b);
      const packingClear = isPackingCleared(b);

      let itemClass = 'order-item';
      if (loadingClear && packingClear) {
        itemClass += ' both-clear';
      } else if (loadingClear) {
        itemClass += ' loading-clear';
      } else if (packingClear) {
        itemClass += ' packing-clear';
      }

      html += `<div class="${itemClass}">`;
      html += render(b);
      html += `</div>`;
    });

    html += `</div>`;
    out.innerHTML += html;
  });

  if (Object.keys(poGroups).length === 0) {
    out.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px">No POs found matching the selected filters.</p>';
  }
}

// Show merged table of all loading started orders
function showMergedTable() {
  if (!mergedData) {
    alert('Please upload and compare files first!');
    return;
  }

  const out = document.getElementById('output');
  out.innerHTML = '';

  // Group data by OC, Style, PO, Country
  const mergedGroups = {};

  Object.values(mergedData).forEach(block => {
    const totalLoadQty = totalLoad(block);

    // Only include orders where loading has started
    if (totalLoadQty > 0) {
      const key = `${block.meta.oc}|${block.meta.style}|${block.meta.po}|${block.meta.country}`;

      if (!mergedGroups[key]) {
        mergedGroups[key] = {
          oc: block.meta.oc,
          style: block.meta.style,
          po: block.meta.po,
          country: block.meta.country,
          orderQty: 0,
          loadQty: 0,
          packQty: 0
        };
      }

      // Sum quantities
      mergedGroups[key].orderQty += Object.values(block.order).reduce((a, b) => a + b, 0);
      mergedGroups[key].loadQty += totalLoadQty;
      mergedGroups[key].packQty += totalPack(block);
    }
  });

  // Sort by OC > Style > PO > Country
  const sortedGroups = Object.values(mergedGroups).sort((a, b) => {
    if (a.oc !== b.oc) return String(a.oc).localeCompare(String(b.oc));
    if (a.style !== b.style) return String(a.style).localeCompare(String(b.style));
    if (a.po !== b.po) return String(a.po).localeCompare(String(b.po));
    return String(a.country).localeCompare(String(b.country));
  });

  // Create table
  let html = `
    <div style="background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1)">
      <h3 style="margin-top:0">Merged Table - All Loading Started Orders</h3>
      <p style="color:#666;margin-bottom:15px">Grouped by OC > Style > PO > Country</p>
      <table style="width:100%;border-collapse:collapse;margin-top:10px">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:2px solid #dee2e6">
            <th style="padding:12px;text-align:left;border:1px solid #dee2e6">OC</th>
            <th style="padding:12px;text-align:left;border:1px solid #dee2e6">Style</th>
            <th style="padding:12px;text-align:left;border:1px solid #dee2e6">PO</th>
            <th style="padding:12px;text-align:left;border:1px solid #dee2e6">Country</th>
            <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Order Qty</th>
            <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Loading Qty</th>
            <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Loading %</th>
            <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Packing Qty</th>
            <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Packing %</th>
          </tr>
        </thead>
        <tbody>
  `;

  sortedGroups.forEach(group => {
    const loadingPercentage = group.orderQty > 0 ? ((group.loadQty / group.orderQty) * 100).toFixed(2) : 0;
    const packingPercentage = group.orderQty > 0 ? ((group.packQty / group.orderQty) * 100).toFixed(2) : 0;

    const loadingPercentColor = loadingPercentage >= 100 ? '#28a745' : (loadingPercentage >= 50 ? '#ffc107' : '#dc3545');
    const packingPercentColor = packingPercentage >= 100 ? '#28a745' : (packingPercentage >= 50 ? '#ffc107' : '#dc3545');

    html += `
      <tr style="border-bottom:1px solid #dee2e6">
        <td style="padding:10px;border:1px solid #dee2e6">${group.oc}</td>
        <td style="padding:10px;border:1px solid #dee2e6;font-weight:bold">${group.style}</td>
        <td style="padding:10px;border:1px solid #dee2e6">${group.po}</td>
        <td style="padding:10px;border:1px solid #dee2e6">${group.country}</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right">${group.orderQty.toLocaleString()}</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right">${group.loadQty.toLocaleString()}</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right;color:${loadingPercentColor};font-weight:bold">${loadingPercentage}%</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right">${group.packQty.toLocaleString()}</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right;color:${packingPercentColor};font-weight:bold">${packingPercentage}%</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      <div style="margin-top:15px;padding:10px;background:#f8f9fa;border-radius:5px">
        <strong>Total Rows:</strong> ${sortedGroups.length}
      </div>
    </div>
  `;

  out.innerHTML = html;
}


// Export to PDF function
async function exportToPDF() {
  if (!mergedData) {
    alert('Please upload and compare files first!');
    return;
  }

  const output = document.getElementById('output');
  if (!output.innerHTML) {
    alert('No data to export. Please select a view first.');
    return;
  }

  // Show loading message
  const originalContent = output.innerHTML;
  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:9999;';
  loadingMsg.innerHTML = '<h3>Generating PDF...</h3><p>Please wait...</p>';
  document.body.appendChild(loadingMsg);

  try {
    const canvas = await html2canvas(output, {
      scale: 1.5,  // Reduced from 2 to 1.5 for smaller file size
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // Use JPEG instead of PNG for better compression
    const imgData = canvas.toDataURL('image/jpeg', 0.7);  // 0.7 quality for good balance
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4', true);  // Enable compression

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const fileName = `Order_Comparison_${currentView}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Error generating PDF. Please try again.');
  } finally {
    document.body.removeChild(loadingMsg);
  }
}

// Export to Excel function
function exportToExcel() {
  if (!mergedData) {
    alert('Please upload and compare files first!');
    return;
  }

  const exportData = [];

  // Prepare data based on current view
  Object.values(mergedData).forEach(b => {
    // Filter based on current view
    let includeRow = false;
    if (currentView === 'loaded') {
      includeRow = totalLoad(b) > 0;
    } else if (currentView === 'notloaded') {
      includeRow = totalLoad(b) === 0;
    } else if (currentView === 'cleared') {
      includeRow = isLoadingCleared(b);
    } else if (currentView === 'partial') {
      includeRow = isPartiallyLoading(b);
    } else if (currentView === 'poview') {
      includeRow = totalLoad(b) > 0;
    }

    if (!includeRow) return;

    const sizes = SIZES.filter(s => b.order[s] || b.load[s] || b.pack[s]);

    sizes.forEach(size => {
      const orderQty = b.order[size] || 0;
      const loadQty = b.load[size] || 0;
      const packQty = b.pack[size] || 0;
      const balanceToLoad = orderQty - loadQty;
      const balanceToPack = loadQty - packQty;

      exportData.push({
        'OC': b.meta.oc,
        'Style': b.meta.style,
        'PO': b.meta.po,
        'Country': b.meta.country,
        'Colour': b.meta.colour,
        'LINE': b.meta.line || '',
        'Colour Name': b.meta.colourName || '',
        'Size': size,
        'Order Qty': orderQty,
        'Load Qty': loadQty,
        'Balance to Load': balanceToLoad,
        'Pack Qty': packQty,
        'Balance to Pack': balanceToPack,
        'Loading Status': isLoadingCleared(b) ? 'Cleared' : (isPartiallyLoading(b) ? 'Partial' : 'Pending'),
        'Packing Status': isPackingCleared(b) ? 'Cleared' : 'Pending'
      });
    });
  });

  if (exportData.length === 0) {
    alert('No data to export.');
    return;
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = [
    { wch: 10 }, // OC
    { wch: 15 }, // Style
    { wch: 15 }, // PO
    { wch: 12 }, // Country
    { wch: 15 }, // Colour
    { wch: 10 }, // LINE
    { wch: 15 }, // Colour Name
    { wch: 8 },  // Size
    { wch: 12 }, // Order Qty
    { wch: 12 }, // Load Qty
    { wch: 15 }, // Balance to Load
    { wch: 12 }, // Pack Qty
    { wch: 15 }, // Balance to Pack
    { wch: 15 }, // Loading Status
    { wch: 15 }  // Packing Status
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Order Comparison');

  const fileName = `Order_Comparison_${currentView}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Calculate and display master summary
function calculateMasterSummary() {
  if (!mergedData) return;

  let totalOrderQty = 0;
  let totalLoadQty = 0;
  let totalPackQty = 0;

  Object.values(mergedData).forEach(b => {
    // Sum all order quantities
    Object.values(b.order).forEach(qty => {
      totalOrderQty += qty;
    });

    // Sum all load quantities
    Object.values(b.load).forEach(qty => {
      totalLoadQty += qty;
    });

    // Sum all pack quantities
    Object.values(b.pack).forEach(qty => {
      totalPackQty += qty;
    });
  });

  const balanceToLoad = totalOrderQty - totalLoadQty;
  const balanceToPack = totalOrderQty - totalPackQty;
  const balanceToPackFromLoading = totalLoadQty - totalPackQty;
  const loadingPercentage = totalOrderQty > 0 ? ((totalLoadQty / totalOrderQty) * 100).toFixed(2) : 0;
  const packingPercentage = totalOrderQty > 0 ? ((totalPackQty / totalOrderQty) * 100).toFixed(2) : 0;

  const masterSummaryContent = document.getElementById('masterSummaryContent');
  masterSummaryContent.innerHTML = `
    <div class="summary-card" style="border-left-color:#007bff;flex:1;min-width:200px">
      <h4>Total Order Qty</h4>
      <p class="count" style="font-size:2em;margin:10px 0">${totalOrderQty.toLocaleString()}</p>
    </div>
    <div class="summary-card" style="border-left-color:#28a745;flex:1;min-width:200px">
      <h4>Total Loading Qty</h4>
      <p class="count" style="font-size:2em;margin:10px 0">${totalLoadQty.toLocaleString()}</p>
      <p style="font-size:0.9em;color:#666;margin:5px 0">
        ${loadingPercentage}% of Orders
      </p>
    </div>
    <div class="summary-card" style="border-left-color:#ffc107;flex:1;min-width:200px">
      <h4>Balance to Load</h4>
      <p class="count" style="font-size:2em;margin:10px 0;color:${balanceToLoad > 0 ? '#dc3545' : '#28a745'}">
        ${balanceToLoad.toLocaleString()}
      </p>
    </div>
    <div class="summary-card" style="border-left-color:#17a2b8;flex:1;min-width:200px">
      <h4>Total Packing Qty</h4>
      <p class="count" style="font-size:2em;margin:10px 0">${totalPackQty.toLocaleString()}</p>
      <p style="font-size:0.9em;color:#666;margin:5px 0">
        ${packingPercentage}% of Orders
      </p>
    </div>
    <div class="summary-card" style="border-left-color:#e83e8c;flex:1;min-width:200px">
      <h4>Balance to Pack<br><small style="font-size:0.7em;font-weight:normal">(Order - Packing)</small></h4>
      <p class="count" style="font-size:2em;margin:10px 0;color:${balanceToPack > 0 ? '#dc3545' : '#28a745'}">
        ${balanceToPack.toLocaleString()}
      </p>
    </div>
    <div class="summary-card" style="border-left-color:#6f42c1;flex:1;min-width:200px">
      <h4>Balance to Pack<br><small style="font-size:0.7em;font-weight:normal">(Loading - Packing)</small></h4>
      <p class="count" style="font-size:2em;margin:10px 0;color:${balanceToPackFromLoading > 0 ? '#dc3545' : '#28a745'}">
        ${balanceToPackFromLoading.toLocaleString()}
      </p>
    </div>
  `;

  document.getElementById('masterSummarySection').style.display = 'block';
}

// Calculate style-wise comparison
function calculateStyleWiseComparison() {
  if (!mergedData) return;

  const styleData = {};

  Object.values(mergedData).forEach(b => {
    const style = b.meta.style;

    if (!styleData[style]) {
      styleData[style] = {
        style: style,
        orderQty: 0,
        loadQty: 0,
        packQty: 0,
        ocs: new Set(),
        pos: new Set(),
        colours: new Set()
      };
    }

    // Sum quantities for this style
    Object.values(b.order).forEach(qty => {
      styleData[style].orderQty += qty;
    });

    Object.values(b.load).forEach(qty => {
      styleData[style].loadQty += qty;
    });

    Object.values(b.pack).forEach(qty => {
      styleData[style].packQty += qty;
    });

    // Track unique OCs, POs, and colours
    if (b.meta.oc) styleData[style].ocs.add(b.meta.oc);
    if (b.meta.po) styleData[style].pos.add(b.meta.po);
    if (b.meta.colour) styleData[style].colours.add(b.meta.colour);
  });

  return styleData;
}

// Toggle style details section
function toggleStyleDetails() {
  const styleDetailsSection = document.getElementById('styleDetailsSection');

  if (styleDetailsSection.style.display === 'none') {
    // Show the details
    displayStyleWiseComparison();
    styleDetailsSection.style.display = 'block';
  } else {
    // Hide the details
    styleDetailsSection.style.display = 'none';
  }
}

// Display style-wise comparison
function displayStyleWiseComparison() {
  const styleData = calculateStyleWiseComparison();
  const styleDetailsContent = document.getElementById('styleDetailsContent');

  if (!styleData || Object.keys(styleData).length === 0) {
    styleDetailsContent.innerHTML = '<p style="color:#999">No data available</p>';
    return;
  }

  let html = `
    <table style="width:100%;border-collapse:collapse;margin-top:10px">
      <thead>
        <tr style="background:#f8f9fa;border-bottom:2px solid #dee2e6">
          <th style="padding:12px;text-align:left;border:1px solid #dee2e6">Style</th>
          <th style="padding:12px;text-align:left;border:1px solid #dee2e6">OCs</th>
          <th style="padding:12px;text-align:left;border:1px solid #dee2e6">POs</th>
          <th style="padding:12px;text-align:left;border:1px solid #dee2e6">Colours</th>
          <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Order Qty</th>
          <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Loading Qty</th>
          <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Balance to Load</th>
          <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Loading %</th>
          <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Packing Qty</th>
          <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Balance to Pack</th>
          <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Packing %</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Sort styles alphabetically
  const sortedStyles = Object.keys(styleData).sort();

  sortedStyles.forEach(style => {
    const data = styleData[style];
    const balanceToLoad = data.orderQty - data.loadQty;
    const balanceToPack = data.orderQty - data.packQty;
    const loadingPercentage = data.orderQty > 0 ? ((data.loadQty / data.orderQty) * 100).toFixed(2) : 0;
    const packingPercentage = data.orderQty > 0 ? ((data.packQty / data.orderQty) * 100).toFixed(2) : 0;

    const balanceLoadColor = balanceToLoad > 0 ? '#dc3545' : (balanceToLoad < 0 ? '#28a745' : '#000');
    const balancePackColor = balanceToPack > 0 ? '#dc3545' : (balanceToPack < 0 ? '#28a745' : '#000');

    const loadingPercentColor = loadingPercentage >= 100 ? '#28a745' : (loadingPercentage >= 50 ? '#ffc107' : '#dc3545');
    const packingPercentColor = packingPercentage >= 100 ? '#28a745' : (packingPercentage >= 50 ? '#ffc107' : '#dc3545');

    html += `
      <tr style="border-bottom:1px solid #dee2e6">
        <td style="padding:10px;border:1px solid #dee2e6;font-weight:bold">${style}</td>
        <td style="padding:10px;border:1px solid #dee2e6">${data.ocs.size}</td>
        <td style="padding:10px;border:1px solid #dee2e6">${data.pos.size}</td>
        <td style="padding:10px;border:1px solid #dee2e6">${data.colours.size}</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right">${data.orderQty.toLocaleString()}</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right">${data.loadQty.toLocaleString()}</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right;color:${balanceLoadColor};font-weight:bold">
          ${balanceToLoad.toLocaleString()}
        </td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right;color:${loadingPercentColor};font-weight:bold">
          ${loadingPercentage}%
        </td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right">${data.packQty.toLocaleString()}</td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right;color:${balancePackColor};font-weight:bold">
          ${balanceToPack.toLocaleString()}
        </td>
        <td style="padding:10px;border:1px solid #dee2e6;text-align:right;color:${packingPercentColor};font-weight:bold">
          ${packingPercentage}%
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  styleDetailsContent.innerHTML = html;
}

// Generate consolidated summary table
function generateConsolidatedTable() {
  if (!mergedData) {
    alert('No data loaded. Please upload and compare files first.');
    return;
  }

  const output = document.getElementById('output');
  output.innerHTML = '';

  // Create table
  let html = `
    <div style="margin:20px 0;">
      <h2 style="color:#333;margin-bottom:15px;">📊 Consolidated Summary Table</h2>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:white;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);color:white;">
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">OC</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">LINE</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">STYLE</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">PO</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">COUNTRY</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">COLOUR</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">COLOUR NAME</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">ORDER QTY</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">LOAD QTY</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">LOAD %</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">BAL TO LOAD</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">PACK QTY</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">PACK %</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">BAL TO PACK</th>
              <th style="padding:12px;text-align:center;border:1px solid #ddd;">STATUS</th>
              <th style="padding:12px;text-align:center;border:1px solid #ddd;">DETAILS</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Add rows for each block
  Object.values(mergedData).forEach((block, index) => {
    const orderTotal = Object.values(block.order).reduce((a, b) => a + b, 0);
    const loadTotal = Object.values(block.load).reduce((a, b) => a + b, 0);
    const packTotal = Object.values(block.pack).reduce((a, b) => a + b, 0);

    const loadPercent = orderTotal > 0 ? ((loadTotal / orderTotal) * 100).toFixed(1) : '0.0';
    const packPercent = orderTotal > 0 ? ((packTotal / orderTotal) * 100).toFixed(1) : '0.0';

    // Balance = Loaded/Packed - Order (positive means over, negative means under)
    const balToLoad = loadTotal - orderTotal;
    const balToPack = packTotal - orderTotal;

    const balLoadColor = balToLoad >= 0 ? '#28a745' : '#dc3545';
    const balPackColor = balToPack >= 0 ? '#28a745' : '#dc3545';

    const displayBalLoad = balToLoad >= 0 ? `+${balToLoad}` : balToLoad;
    const displayBalPack = balToPack >= 0 ? `+${balToPack}` : balToPack;

    // Determine status
    let status = '';
    let statusColor = '';

    const loadingCleared = isLoadingCleared(block);
    const packingCleared = isPackingCleared(block);

    if (loadingCleared && packingCleared) {
      status = '✅ Both Cleared';
      statusColor = '#28a745';
    } else if (loadingCleared) {
      status = '🟡 Loading Cleared';
      statusColor = '#ffc107';
    } else if (packingCleared) {
      status = '🟢 Packing Cleared';
      statusColor = '#17a2b8';
    } else if (loadTotal > 0 || packTotal > 0) {
      status = '🔄 In Progress';
      statusColor = '#6c757d';
    } else {
      status = '⏸️ Not Started';
      statusColor = '#dc3545';
    }

    const rowBg = index % 2 === 0 ? '#f8f9fa' : 'white';

    html += `
      <tr style="background:${rowBg};">
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.oc || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.line || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.style || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.po || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.country || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.colour || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.colourName || '-'}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;font-weight:bold;">${orderTotal}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;">${loadTotal}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${loadPercent >= 100 ? '#28a745' : '#666'};">${loadPercent}%</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${balLoadColor};font-weight:bold;">${displayBalLoad}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;">${packTotal}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${packPercent >= 100 ? '#28a745' : '#666'};">${packPercent}%</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${balPackColor};font-weight:bold;">${displayBalPack}</td>
        <td style="padding:10px;text-align:center;border:1px solid #ddd;color:${statusColor};font-weight:bold;font-size:12px;">${status}</td>
        <td style="padding:10px;text-align:center;border:1px solid #ddd;">
          <button onclick="showBlockDetails(${index})" style="background:#007bff;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">View Details</button>
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  output.innerHTML = html;
}

// Show detailed size breakdown for a block
function showBlockDetails(blockIndex) {
  const blocks = Object.values(mergedData);
  if (blockIndex >= blocks.length) return;

  const block = blocks[blockIndex];
  const sizes = SIZES.filter(s => block.order[s] || block.load[s] || block.pack[s]);

  let detailHTML = `
    <div id="detailModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:white;border-radius:10px;max-width:900px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:20px;border-radius:10px 10px 0 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h2 style="margin:0;color:white;font-size:20px;">📋 Detailed Size Breakdown</h2>
            <button onclick="closeDetailModal()" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;font-size:18px;font-weight:bold;">✕</button>
          </div>
        </div>
        
        <!-- Block Info -->
        <div style="padding:20px;background:#f8f9fa;border-bottom:2px solid #dee2e6;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;font-size:14px;">
            <div><strong>OC:</strong> ${block.meta.oc}</div>
            <div><strong>LINE:</strong> ${block.meta.line || '-'}</div>
            <div><strong>Style:</strong> ${block.meta.style}</div>
            <div><strong>PO:</strong> ${block.meta.po}</div>
            <div><strong>Country:</strong> ${block.meta.country}</div>
            <div><strong>Colour:</strong> ${block.meta.colour}</div>
            <div><strong>Colour Name:</strong> ${block.meta.colourName || '-'}</div>
          </div>
        </div>
        
        <!-- Size Table -->
        <div style="padding:20px;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#667eea;color:white;">
                <th style="padding:10px;text-align:left;border:1px solid #ddd;position:sticky;left:0;background:#667eea;z-index:1;">TYPE</th>
  `;

  // Add size columns
  sizes.forEach(size => {
    detailHTML += `<th style="padding:10px;text-align:center;border:1px solid #ddd;">${size}</th>`;
  });

  detailHTML += `
                <th style="padding:10px;text-align:center;border:1px solid #ddd;background:#764ba2;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
  `;

  // Order Qty Row
  detailHTML += `<tr style="background:#f8f9fa;"><td style="padding:10px;font-weight:bold;border:1px solid #ddd;position:sticky;left:0;background:#f8f9fa;z-index:1;">ORDER QTY</td>`;
  let orderTotal = 0;
  sizes.forEach(size => {
    const qty = block.order[size] || 0;
    orderTotal += qty;
    detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;font-weight:bold;">${qty}</td>`;
  });
  detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;font-weight:bold;background:#e9ecef;">${orderTotal}</td></tr>`;

  // Load Qty Row
  let loadTotal = 0;
  detailHTML += `<tr style="background:white;"><td style="padding:10px;font-weight:bold;border:1px solid #ddd;position:sticky;left:0;background:white;z-index:1;">LOAD QTY</td>`;
  sizes.forEach(size => {
    const qty = block.load[size] || 0;
    loadTotal += qty;
    detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;">${qty}</td>`;
  });
  detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;font-weight:bold;background:#e9ecef;">${loadTotal}</td></tr>`;

  // Load % Row
  detailHTML += `<tr style="background:#f8f9fa;"><td style="padding:10px;font-weight:bold;border:1px solid #ddd;position:sticky;left:0;background:#f8f9fa;z-index:1;">LOAD %</td>`;
  sizes.forEach(size => {
    const orderQty = block.order[size] || 0;
    const loadQty = block.load[size] || 0;
    const percent = orderQty > 0 ? ((loadQty / orderQty) * 100).toFixed(1) : '0.0';
    const color = percent >= 100 ? '#28a745' : '#666';
    detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;color:${color};">${percent}%</td>`;
  });
  const totalLoadPercent = orderTotal > 0 ? ((loadTotal / orderTotal) * 100).toFixed(1) : '0.0';
  const totalLoadColor = totalLoadPercent >= 100 ? '#28a745' : '#666';
  detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;font-weight:bold;background:#e9ecef;color:${totalLoadColor};">${totalLoadPercent}%</td></tr>`;

  // Balance to Load Row (Load - Order: positive=overloaded in green, negative=underloaded in red)
  let balLoadTotal = 0;
  detailHTML += `<tr style="background:white;"><td style="padding:10px;font-weight:bold;border:1px solid #ddd;position:sticky;left:0;background:white;z-index:1;">BAL TO LOAD</td>`;
  sizes.forEach(size => {
    const orderQty = block.order[size] || 0;
    const loadQty = block.load[size] || 0;
    const bal = loadQty - orderQty; // Load - Order
    balLoadTotal += bal;
    const color = bal >= 0 ? '#28a745' : '#dc3545';
    const displayBal = bal >= 0 ? `+${bal}` : bal;
    detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;color:${color};font-weight:bold;">${displayBal}</td>`;
  });
  const balLoadColor = balLoadTotal >= 0 ? '#28a745' : '#dc3545';
  const displayBalLoadTotal = balLoadTotal >= 0 ? `+${balLoadTotal}` : balLoadTotal;
  detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;font-weight:bold;background:#e9ecef;color:${balLoadColor};">${displayBalLoadTotal}</td></tr>`;

  // Pack Qty Row
  let packTotal = 0;
  detailHTML += `<tr style="background:#f8f9fa;"><td style="padding:10px;font-weight:bold;border:1px solid #ddd;position:sticky;left:0;background:#f8f9fa;z-index:1;">PACK QTY</td>`;
  sizes.forEach(size => {
    const qty = block.pack[size] || 0;
    packTotal += qty;
    detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;">${qty}</td>`;
  });
  detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;font-weight:bold;background:#e9ecef;">${packTotal}</td></tr>`;

  // Pack % Row
  detailHTML += `<tr style="background:white;"><td style="padding:10px;font-weight:bold;border:1px solid #ddd;position:sticky;left:0;background:white;z-index:1;">PACK %</td>`;
  sizes.forEach(size => {
    const orderQty = block.order[size] || 0;
    const packQty = block.pack[size] || 0;
    const percent = orderQty > 0 ? ((packQty / orderQty) * 100).toFixed(1) : '0.0';
    const color = percent >= 100 ? '#28a745' : '#666';
    detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;color:${color};">${percent}%</td>`;
  });
  const totalPackPercent = orderTotal > 0 ? ((packTotal / orderTotal) * 100).toFixed(1) : '0.0';
  const totalPackColor = totalPackPercent >= 100 ? '#28a745' : '#666';
  detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;font-weight:bold;background:#e9ecef;color:${totalPackColor};">${totalPackPercent}%</td></tr>`;

  // Balance to Pack Row (Pack - Order: positive=overpacked in green, negative=underpacked in red)
  let balPackTotal = 0;
  detailHTML += `<tr style="background:#f8f9fa;"><td style="padding:10px;font-weight:bold;border:1px solid #ddd;position:sticky;left:0;background:#f8f9fa;z-index:1;">BAL TO PACK</td>`;
  sizes.forEach(size => {
    const orderQty = block.order[size] || 0;
    const packQty = block.pack[size] || 0;
    const bal = packQty - orderQty; // Pack - Order
    balPackTotal += bal;
    const color = bal >= 0 ? '#28a745' : '#dc3545';
    const displayBal = bal >= 0 ? `+${bal}` : bal;
    detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;color:${color};font-weight:bold;">${displayBal}</td>`;
  });
  const balPackColor = balPackTotal >= 0 ? '#28a745' : '#dc3545';
  const displayBalPackTotal = balPackTotal >= 0 ? `+${balPackTotal}` : balPackTotal;
  detailHTML += `<td style="padding:10px;text-align:center;border:1px solid #ddd;font-weight:bold;background:#e9ecef;color:${balPackColor};">${displayBalPackTotal}</td></tr>`;

  detailHTML += `
            </tbody>
          </table>
        </div>
        
        <!-- Close Button -->
        <div style="padding:20px;text-align:center;background:#f8f9fa;border-radius:0 0 10px 10px;">
          <button onclick="closeDetailModal()" style="background:#007bff;color:white;border:none;padding:12px 30px;border-radius:5px;cursor:pointer;font-size:14px;font-weight:bold;">Close</button>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('detailModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', detailHTML);
}

// Close detail modal
function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.remove();
  }
}

// Generate consolidated table with view and filter support
function generateConsolidatedTableFiltered() {
  if (!mergedData) {
    alert('No data loaded. Please upload and compare files first.');
    return;
  }

  const output = document.getElementById('output');

  // Get filter values
  const ocFilter = document.getElementById('ocFilter');
  const styleFilter = document.getElementById('styleFilter');
  const colourFilter = document.getElementById('colourFilter');
  const poFilter = document.getElementById('poFilter');

  const selectedOCs = Array.from(ocFilter.selectedOptions).map(o => o.value);
  const selectedStyles = Array.from(styleFilter.selectedOptions).map(o => o.value);
  const selectedColours = Array.from(colourFilter.selectedOptions).map(o => o.value);
  const selectedPOs = Array.from(poFilter.selectedOptions).map(o => o.value);

  // Determine view title
  let viewTitle = 'All Data';
  if (currentView === 'loaded') viewTitle = 'Loading Started';
  else if (currentView === 'notloaded') viewTitle = 'Not Loaded';
  else if (currentView === 'cleared') viewTitle = 'Loading Cleared';
  else if (currentView === 'partial') viewTitle = 'Partially Loading';
  else if (currentView === 'packingcleared') viewTitle = 'Packing Cleared';
  else if (currentView === 'partialpacking') viewTitle = 'Partially Packing';
  else if (currentView === 'loadingclearednotpacking') viewTitle = 'Loading Cleared (Not Packing)';

  // Create table
  let html = `
    <div style="margin:20px 0;">
      <h2 style="color:#333;margin-bottom:15px;">📊 ${viewTitle} - Consolidated Summary</h2>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:white;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:linear-gradient(135deg, #134e5e 0%, #71b280 100%);color:white;">
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">OC</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">LINE</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">STYLE</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">PO</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">COUNTRY</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">COLOUR</th>
              <th style="padding:12px;text-align:left;border:1px solid #ddd;">COLOUR NAME</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">ORDER QTY</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">LOAD QTY</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">LOAD %</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">BAL TO LOAD</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">PACK QTY</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">PACK %</th>
              <th style="padding:12px;text-align:right;border:1px solid #ddd;">BAL TO PACK</th>
              <th style="padding:12px;text-align:center;border:1px solid #ddd;">STATUS</th>
              <th style="padding:12px;text-align:center;border:1px solid #ddd;">DETAILS</th>
            </tr>
          </thead>
          <tbody>
  `;

  let count = 0;

  // Add rows for each block that matches view and filters
  Object.values(mergedData).forEach((block, index) => {
    // Check if matches current view
    let matchesView = false;
    if (currentView === 'loaded') {
      matchesView = totalLoad(block) > 0;
    } else if (currentView === 'notloaded') {
      matchesView = totalLoad(block) === 0;
    } else if (currentView === 'cleared') {
      matchesView = isLoadingCleared(block);
    } else if (currentView === 'partial') {
      matchesView = isPartiallyLoading(block);
    } else if (currentView === 'packingcleared') {
      matchesView = isPackingCleared(block);
    } else if (currentView === 'partialpacking') {
      matchesView = isPartiallyPacking(block);
    } else if (currentView === 'loadingclearednotpacking') {
      matchesView = isLoadingCleared(block) && !isPackingCleared(block);
    }

    if (!matchesView) return;

    // Check filters
    const matchesOC = selectedOCs.includes('ALL') || selectedOCs.includes(String(block.meta.oc));
    const matchesStyle = selectedStyles.includes('ALL') || selectedStyles.includes(String(block.meta.style));
    const matchesColour = selectedColours.includes('ALL') || selectedColours.includes(String(block.meta.colour));
    const matchesPO = selectedPOs.includes('ALL') || selectedPOs.includes(String(block.meta.po));

    if (!(matchesOC && matchesStyle && matchesColour && matchesPO)) return;

    count++;

    const orderTotal = Object.values(block.order).reduce((a, b) => a + b, 0);
    const loadTotal = Object.values(block.load).reduce((a, b) => a + b, 0);
    const packTotal = Object.values(block.pack).reduce((a, b) => a + b, 0);

    const loadPercent = orderTotal > 0 ? ((loadTotal / orderTotal) * 100).toFixed(1) : '0.0';
    const packPercent = orderTotal > 0 ? ((packTotal / orderTotal) * 100).toFixed(1) : '0.0';

    const balToLoad = loadTotal - orderTotal;
    const balToPack = packTotal - orderTotal;

    const balLoadColor = balToLoad >= 0 ? '#28a745' : '#dc3545';
    const balPackColor = balToPack >= 0 ? '#28a745' : '#dc3545';

    const displayBalLoad = balToLoad >= 0 ? `+${balToLoad}` : balToLoad;
    const displayBalPack = balToPack >= 0 ? `+${balToPack}` : balToPack;

    // Determine status
    let status = '';
    let statusColor = '';

    const loadingCleared = isLoadingCleared(block);
    const packingCleared = isPackingCleared(block);

    if (loadingCleared && packingCleared) {
      status = '✅ Both Cleared';
      statusColor = '#28a745';
    } else if (loadingCleared) {
      status = '🟡 Loading Cleared';
      statusColor = '#ffc107';
    } else if (packingCleared) {
      status = '🟢 Packing Cleared';
      statusColor = '#17a2b8';
    } else if (loadTotal > 0 || packTotal > 0) {
      status = '🔄 In Progress';
      statusColor = '#6c757d';
    } else {
      status = '⏸️ Not Started';
      statusColor = '#dc3545';
    }

    const rowBg = count % 2 === 0 ? 'white' : '#f8f9fa';

    html += `
      <tr style="background:${rowBg};">
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.oc || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.line || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.style || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.po || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.country || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.colour || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.colourName || '-'}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;font-weight:bold;">${orderTotal}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;">${loadTotal}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${loadPercent >= 100 ? '#28a745' : '#666'};">${loadPercent}%</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${balLoadColor};font-weight:bold;">${displayBalLoad}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;">${packTotal}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${packPercent >= 100 ? '#28a745' : '#666'};">${packPercent}%</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${balPackColor};font-weight:bold;">${displayBalPack}</td>
        <td style="padding:10px;text-align:center;border:1px solid #ddd;color:${statusColor};font-weight:bold;font-size:12px;">${status}</td>
        <td style="padding:10px;text-align:center;border:1px solid #ddd;">
          <button onclick="showBlockDetails(${index})" style="background:#007bff;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">View Details</button>
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (count === 0) {
    output.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px;text-align:center;">No results found matching the selected view and filters.</p>';
  } else {
    output.innerHTML = html;
  }
}

// Show OC View
function showOCView() {
  if (!mergedData) {
    alert('Please upload and compare files first.');
    return;
  }

  currentView = 'ocview';

  // Get unique OCs
  const ocs = new Set();
  Object.values(mergedData).forEach(block => {
    if (block.meta.oc) ocs.add(block.meta.oc);
  });

  const output = document.getElementById('output');

  let html = `
    <div style="margin:20px 0;">
      <h2 style="color:#333;margin-bottom:20px;">📋 OC View - Select Order Confirmation</h2>
      
      <div style="background:white;padding:20px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:20px;">
        <label style="font-weight:bold;font-size:16px;color:#333;margin-right:15px;">Select OC:</label>
        <select id="ocViewSelect" onchange="renderOCView()" style="padding:10px 15px;font-size:14px;border:2px solid #6f42c1;border-radius:5px;min-width:200px;cursor:pointer;">
          <option value="">-- Choose an OC --</option>
  `;

  Array.from(ocs).sort().forEach(oc => {
    html += `<option value="${oc}">${oc}</option>`;
  });

  html += `
        </select>
      </div>
      
      <div id="ocViewContent"></div>
    </div>
  `;

  output.innerHTML = html;
}

// Render OC View table for selected OC
function renderOCView() {
  const selectedOC = document.getElementById('ocViewSelect').value;
  const contentDiv = document.getElementById('ocViewContent');

  if (!selectedOC) {
    contentDiv.innerHTML = '<p style="color:#999;text-align:center;padding:40px;">Please select an OC to view details.</p>';
    return;
  }

  // Filter blocks by selected OC
  const ocBlocks = Object.values(mergedData).filter(block => block.meta.oc === selectedOC);

  if (ocBlocks.length === 0) {
    contentDiv.innerHTML = '<p style="color:#999;text-align:center;padding:40px;">No data found for this OC.</p>';
    return;
  }

  // Calculate totals
  let totalOrder = 0;
  let totalLoad = 0;
  let totalPack = 0;

  let html = `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:white;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background:linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);color:white;">
            <th style="padding:12px;text-align:left;border:1px solid #ddd;">OC</th>
            <th style="padding:12px;text-align:left;border:1px solid #ddd;">STYLE</th>
            <th style="padding:12px;text-align:left;border:1px solid #ddd;">PO</th>
            <th style="padding:12px;text-align:left;border:1px solid #ddd;">COUNTRY</th>
            <th style="padding:12px;text-align:left;border:1px solid #ddd;">COLOUR</th>
            <th style="padding:12px;text-align:left;border:1px solid #ddd;">COLOUR NAME</th>
            <th style="padding:12px;text-align:right;border:1px solid #ddd;">ORDER QTY</th>
            <th style="padding:12px;text-align:right;border:1px solid #ddd;">LOAD QTY</th>
            <th style="padding:12px;text-align:right;border:1px solid #ddd;">BAL TO LOAD</th>
            <th style="padding:12px;text-align:right;border:1px solid #ddd;">LOAD %</th>
            <th style="padding:12px;text-align:right;border:1px solid #ddd;">PACK QTY</th>
            <th style="padding:12px;text-align:right;border:1px solid #ddd;">BAL TO PACK</th>
            <th style="padding:12px;text-align:right;border:1px solid #ddd;">PACK %</th>
            <th style="padding:12px;text-align:center;border:1px solid #ddd;">DETAILS</th>
          </tr>
        </thead>
        <tbody>
  `;

  ocBlocks.forEach((block, index) => {
    const orderQty = Object.values(block.order).reduce((a, b) => a + b, 0);
    const loadQty = Object.values(block.load).reduce((a, b) => a + b, 0);
    const packQty = Object.values(block.pack).reduce((a, b) => a + b, 0);

    totalOrder += orderQty;
    totalLoad += loadQty;
    totalPack += packQty;

    const balToLoad = loadQty - orderQty;
    const balToPack = packQty - orderQty;

    const loadPercent = orderQty > 0 ? ((loadQty / orderQty) * 100).toFixed(1) : '0.0';
    const packPercent = orderQty > 0 ? ((packQty / orderQty) * 100).toFixed(1) : '0.0';

    const balLoadColor = balToLoad >= 0 ? '#28a745' : '#dc3545';
    const balPackColor = balToPack >= 0 ? '#28a745' : '#dc3545';

    const displayBalLoad = balToLoad >= 0 ? `+${balToLoad}` : balToLoad;
    const displayBalPack = balToPack >= 0 ? `+${balToPack}` : balToPack;

    const rowBg = index % 2 === 0 ? '#f8f9fa' : 'white';

    // Find the actual index in mergedData for the details button
    const blockIndex = Object.values(mergedData).indexOf(block);

    html += `
      <tr style="background:${rowBg};">
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.oc || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.style || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.po || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.country || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.colour || '-'}</td>
        <td style="padding:10px;border:1px solid #ddd;">${block.meta.colourName || '-'}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;font-weight:bold;">${orderQty}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;">${loadQty}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${balLoadColor};font-weight:bold;">${displayBalLoad}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${loadPercent >= 100 ? '#28a745' : '#666'};">${loadPercent}%</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;">${packQty}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${balPackColor};font-weight:bold;">${displayBalPack}</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd;color:${packPercent >= 100 ? '#28a745' : '#666'};">${packPercent}%</td>
        <td style="padding:10px;text-align:center;border:1px solid #ddd;">
          <button onclick="showBlockDetails(${blockIndex})" style="background:#007bff;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">View Details</button>
        </td>
      </tr>
    `;
  });

  // Add totals row
  const totalBalLoad = totalLoad - totalOrder;
  const totalBalPack = totalPack - totalOrder;

  const totalLoadPercent = totalOrder > 0 ? ((totalLoad / totalOrder) * 100).toFixed(1) : '0.0';
  const totalPackPercent = totalOrder > 0 ? ((totalPack / totalOrder) * 100).toFixed(1) : '0.0';

  const totalBalLoadColor = totalBalLoad >= 0 ? '#28a745' : '#dc3545';
  const totalBalPackColor = totalBalPack >= 0 ? '#28a745' : '#dc3545';

  const displayTotalBalLoad = totalBalLoad >= 0 ? `+${totalBalLoad}` : totalBalLoad;
  const displayTotalBalPack = totalBalPack >= 0 ? `+${totalBalPack}` : totalBalPack;

  html += `
          <tr style="background:#e9ecef;font-weight:bold;border-top:3px solid #6f42c1;">
            <td colspan="6" style="padding:12px;border:1px solid #ddd;text-align:right;font-size:14px;">TOTAL:</td>
            <td style="padding:12px;text-align:right;border:1px solid #ddd;font-size:14px;">${totalOrder}</td>
            <td style="padding:12px;text-align:right;border:1px solid #ddd;font-size:14px;">${totalLoad}</td>
            <td style="padding:12px;text-align:right;border:1px solid #ddd;color:${totalBalLoadColor};font-size:14px;">${displayTotalBalLoad}</td>
            <td style="padding:12px;text-align:right;border:1px solid #ddd;color:${totalLoadPercent >= 100 ? '#28a745' : '#666'};font-size:14px;">${totalLoadPercent}%</td>
            <td style="padding:12px;text-align:right;border:1px solid #ddd;font-size:14px;">${totalPack}</td>
            <td style="padding:12px;text-align:right;border:1px solid #ddd;color:${totalBalPackColor};font-size:14px;">${displayTotalBalPack}</td>
            <td style="padding:12px;text-align:right;border:1px solid #ddd;color:${totalPackPercent >= 100 ? '#28a745' : '#666'};font-size:14px;">${totalPackPercent}%</td>
            <td style="padding:12px;border:1px solid #ddd;"></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  contentDiv.innerHTML = html;
}
