// Demo Files Download Modal
function showDemoFilesModal() {
  const modal = document.createElement('div');
  modal.id = 'demoFilesModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';

  modal.innerHTML = `
    <div style="background:white;border-radius:12px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:25px;border-radius:12px 12px 0 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;color:white;font-size:22px;">📥 Download Demo Files</h2>
          <button onclick="closeDemoFilesModal()" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;font-size:20px;font-weight:bold;">✕</button>
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding:30px;">
        <p style="color:#555;margin-bottom:25px;line-height:1.6;">
          Download sample Excel files (.xlsx) to use as templates for your data. These files show the exact structure required by the application.
        </p>
        
        <!-- File Cards -->
        <div style="display:grid;gap:15px;margin-bottom:25px;">
          
          <!-- Order File -->
          <div style="background:#f8f9ff;padding:20px;border-radius:8px;border-left:4px solid #667eea;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <h3 style="margin:0 0 8px 0;color:#333;font-size:16px;">📋 Order File</h3>
                <p style="margin:0;color:#666;font-size:13px;">Contains order details and quantities</p>
              </div>
              <button onclick="downloadDemoFile('order')" style="background:#667eea;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold;white-space:nowrap;">
                Download
              </button>
            </div>
          </div>
          
          <!-- Loading File -->
          <div style="background:#f8f9ff;padding:20px;border-radius:8px;border-left:4px solid #667eea;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <h3 style="margin:0 0 8px 0;color:#333;font-size:16px;">🚚 Loading File</h3>
                <p style="margin:0;color:#666;font-size:13px;">Contains loading/shipment quantities</p>
              </div>
              <button onclick="downloadDemoFile('loading')" style="background:#667eea;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold;white-space:nowrap;">
                Download
              </button>
            </div>
          </div>
          
          <!-- Packing File -->
          <div style="background:#f8f9ff;padding:20px;border-radius:8px;border-left:4px solid #667eea;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <h3 style="margin:0 0 8px 0;color:#333;font-size:16px;">📦 Packing File</h3>
                <p style="margin:0;color:#666;font-size:13px;">Contains packing quantities</p>
              </div>
              <button onclick="downloadDemoFile('packing')" style="background:#667eea;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold;white-space:nowrap;">
                Download
              </button>
            </div>
          </div>
          
          <!-- Download All -->
          <div style="background:#e7f3ff;padding:20px;border-radius:8px;border:2px dashed #667eea;text-align:center;">
            <button onclick="downloadAllDemoFiles()" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;padding:12px 30px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:15px;">
              📥 Download All 3 Files
            </button>
          </div>
          
        </div>
        
        <!-- Info Box -->
        <div style="background:#fff3cd;padding:15px;border-radius:6px;border-left:4px solid #ffc107;">
          <p style="margin:0 0 10px 0;font-weight:bold;color:#856404;">💡 How to Use:</p>
          <ol style="margin:0;padding-left:20px;color:#856404;font-size:13px;line-height:1.8;">
            <li>Download the Excel files (.xlsx)</li>
            <li>Open in Excel or Google Sheets</li>
            <li>Replace sample data with your actual data</li>
            <li>Keep the same column structure</li>
            <li>Save and upload to the application</li>
          </ol>
        </div>
        
        <!-- Documentation Link -->
        <div style="margin-top:20px;padding:15px;background:#f8f9fa;border-radius:6px;text-align:center;">
          <p style="margin:0;color:#666;font-size:13px;">
            📖 Need help? See <strong>EXCEL_FILE_STRUCTURE.md</strong> for detailed documentation
          </p>
        </div>
        
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeDemoFilesModal() {
  const modal = document.getElementById('demoFilesModal');
  if (modal) {
    modal.remove();
  }
}

function downloadDemoFile(type) {
  // Demo data as 2D arrays (same format as Excel)
  const demoData = {
    order: [
      ['OC', 'LINE', 'STYLE', 'PO', 'COUNTRY', 'COLOUR', 'COLOUR NAME', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
      ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-001', 'USA', 'C01', 'Navy Blue', 100, 200, 300, 250, 150, 50],
      ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-002', 'UK', 'C02', 'Black', 80, 150, 200, 180, 100, 40],
      ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-003', 'Canada', 'C01', 'Navy Blue', 120, 180, 220, 200, 130, 60],
      ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-004', 'Australia', 'C03', 'Red', 90, 140, 180, 160, 110, 50],
      ['OC003', 'LINE-C', 'ST-11111', 'PO-2024-005', 'Germany', 'C01', 'Navy Blue', 110, 170, 210, 190, 120, 55]
    ],

    loading: [
      ['OC', 'LINE', 'STYLE', 'PO', 'COUNTRY', 'COLOUR', 'COLOUR NAME', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
      ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-001', 'USA', 'C01', 'Navy Blue', 80, 180, 250, 200, 120, 40],
      ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-002', 'UK', 'C02', 'Black', 60, 120, 150, 140, 80, 30],
      ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-003', 'Canada', 'C01', 'Navy Blue', 100, 150, 180, 160, 100, 50],
      ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-004', 'Australia', 'C03', 'Red', 70, 110, 140, 130, 90, 40],
      ['OC003', 'LINE-C', 'ST-11111', 'PO-2024-005', 'Germany', 'C01', 'Navy Blue', 90, 140, 170, 150, 100, 45]
    ],

    packing: [
      ['OC', 'LINE', 'STYLE', 'PO', 'COUNTRY', 'COLOUR', 'COLOUR NAME', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
      ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-001', 'USA', 'C01', 'Navy Blue', 70, 160, 220, 180, 100, 35],
      ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-002', 'UK', 'C02', 'Black', 50, 100, 130, 120, 70, 25],
      ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-003', 'Canada', 'C01', 'Navy Blue', 90, 130, 160, 140, 90, 45],
      ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-004', 'Australia', 'C03', 'Red', 60, 95, 120, 110, 75, 35],
      ['OC003', 'LINE-C', 'ST-11111', 'PO-2024-005', 'Germany', 'C01', 'Navy Blue', 80, 120, 150, 130, 85, 40]
    ]
  };

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(demoData[type]);

  // Set column widths for better readability
  ws['!cols'] = [
    { wch: 8 },  // OC
    { wch: 10 }, // LINE
    { wch: 12 }, // STYLE
    { wch: 15 }, // PO
    { wch: 12 }, // COUNTRY
    { wch: 10 }, // COLOUR
    { wch: 15 }, // COLOUR NAME
    { wch: 6 },  // XS
    { wch: 6 },  // S
    { wch: 6 },  // M
    { wch: 6 },  // L
    { wch: 6 },  // XL
    { wch: 6 }   // XXL
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Generate Excel file and download
  XLSX.writeFile(wb, `demo-${type}.xlsx`);

  console.log(`✅ Downloaded: demo-${type}.xlsx`);
}

function downloadAllDemoFiles() {
  downloadDemoFile('order');
  setTimeout(() => downloadDemoFile('loading'), 300);
  setTimeout(() => downloadDemoFile('packing'), 600);

  // Show success message
  const modal = document.getElementById('demoFilesModal');
  if (modal) {
    const successMsg = document.createElement('div');
    successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:10001;animation:slideIn 0.3s;';
    successMsg.innerHTML = '✅ All 3 files downloaded!';
    document.body.appendChild(successMsg);

    setTimeout(() => {
      successMsg.style.animation = 'slideOut 0.3s';
      setTimeout(() => successMsg.remove(), 300);
    }, 2000);
  }
}

// Show Supported Sizes Modal
function showSupportedSizes() {
  const modal = document.createElement('div');
  modal.id = 'sizesModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';

  // Group sizes by type
  const letterSizes = SIZES.filter(s => /^[A-Z]+$/.test(s));
  const numericSizes = SIZES.filter(s => /^\d+$/.test(s));
  const otherSizes = SIZES.filter(s => !/^[A-Z]+$/.test(s) && !/^\d+$/.test(s));

  modal.innerHTML = `
    <div style="background:white;border-radius:12px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
      
      <!-- Header -->
      <div style="background:#28a745;padding:25px;border-radius:12px 12px 0 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;color:white;font-size:22px;">📏 Supported Size Columns</h2>
          <button onclick="closeSizesModal()" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;font-size:20px;font-weight:bold;">✕</button>
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding:30px;">
        <p style="color:#555;margin-bottom:20px;line-height:1.6;">
          The application recognizes <strong>${SIZES.length} size columns</strong>. Your Excel files must use these exact column names.
        </p>
        
        ${letterSizes.length > 0 ? `
        <!-- Letter Sizes -->
        <div style="margin-bottom:25px;">
          <h3 style="color:#333;font-size:16px;margin-bottom:12px;border-bottom:2px solid #28a745;padding-bottom:8px;">
            📝 Letter Sizes (${letterSizes.length})
          </h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${letterSizes.map(size => `
              <span style="background:#e7f3ff;color:#0066cc;padding:6px 12px;border-radius:5px;font-weight:bold;font-size:13px;">${size}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${numericSizes.length > 0 ? `
        <!-- Numeric Sizes -->
        <div style="margin-bottom:25px;">
          <h3 style="color:#333;font-size:16px;margin-bottom:12px;border-bottom:2px solid #28a745;padding-bottom:8px;">
            🔢 Numeric Sizes (${numericSizes.length})
          </h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${numericSizes.map(size => `
              <span style="background:#fff3cd;color:#856404;padding:6px 12px;border-radius:5px;font-weight:bold;font-size:13px;">${size}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${otherSizes.length > 0 ? `
        <!-- Other Sizes -->
        <div style="margin-bottom:25px;">
          <h3 style="color:#333;font-size:16px;margin-bottom:12px;border-bottom:2px solid #28a745;padding-bottom:8px;">
            ✨ Other Sizes (${otherSizes.length})
          </h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${otherSizes.map(size => `
              <span style="background:#f8d7da;color:#721c24;padding:6px 12px;border-radius:5px;font-weight:bold;font-size:13px;">${size}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <!-- Info Box -->
        <div style="background:#d1ecf1;padding:15px;border-radius:6px;border-left:4px solid #17a2b8;margin-top:20px;">
          <p style="margin:0 0 10px 0;font-weight:bold;color:#0c5460;">💡 How to Add More Sizes:</p>
          <ol style="margin:0;padding-left:20px;color:#0c5460;font-size:13px;line-height:1.8;">
            <li>Open <code style="background:#fff;padding:2px 6px;border-radius:3px;">sizes-config.js</code></li>
            <li>Add your size to the SIZES array</li>
            <li>Save and refresh the browser</li>
          </ol>
        </div>
        
        <!-- Documentation Link -->
        <div style="margin-top:20px;padding:15px;background:#f8f9fa;border-radius:6px;text-align:center;">
          <p style="margin:0;color:#666;font-size:13px;">
            📖 See <strong>SIZES_CONFIGURATION.md</strong> for detailed instructions
          </p>
        </div>
        
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeSizesModal() {
  const modal = document.getElementById('sizesModal');
  if (modal) {
    modal.remove();
  }
}
