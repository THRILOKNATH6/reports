let packData = null;
let currentView = 'daily'; // 'daily' or 'merged'
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
    if (!excelDate || isNaN(excelDate)) return null;
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date;
}

function formatDate(excelDate) {
    const date = excelDateToJSDate(excelDate);
    if (!date) return 'Invalid Date';
    return date.toISOString().split('T')[0];
}

function normalizeData(data, mode) {
    const rows = [];
    const headers = data[0].map(h => String(h).trim().toUpperCase());

    const idx = {
        oc: col(headers, "OC"),
        style: col(headers, "STYLE"),
        po: col(headers, "PO NO"),
        country: col(headers, "COUNTRY"),
        colour: col(headers, "COLOUR"),
        line: col(headers, "LINE"),
        date: col(headers, "DATE")
    };

    const sizeIdx = {};
    SIZES.forEach(s => sizeIdx[s] = col(headers, s));

    for (let i = 1; i < data.length; i++) {
        const r = data[i];
        if (!r || !r[idx.po]) continue;

        const dateStr = r[idx.date] ? formatDate(r[idx.date]) : null;
        if (!dateStr) continue;

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
                line: r[idx.line],
                date: dateStr,
                size: s,
                qty: qty,
                type: mode
            });
        });
    }
    return rows;
}

// Load data from shared localStorage (uploaded on main page)
function loadFromLocalStorage() {
    try {
        const sharedData = localStorage.getItem('sharedExcelData');

        if (sharedData) {
            const parsed = JSON.parse(sharedData);

            // Process only packing data
            if (parsed.packData) {
                packData = normalizeData(parsed.packData, 'PACK');
            }

            const statusMsg = document.getElementById('dataStatusMessage');
            const timestampSpan = document.getElementById('dataTimestamp');
            const noDataMsg = document.getElementById('noDataMessage');

            if (statusMsg && timestampSpan && packData) {
                const savedDate = new Date(parsed.timestamp);
                timestampSpan.textContent = `(Uploaded: ${savedDate.toLocaleString()})`;
                statusMsg.style.display = 'block';
            }

            if (noDataMsg) {
                if (packData) {
                    noDataMsg.style.display = 'none';
                } else {
                    noDataMsg.style.display = 'block';
                }
            }

            if (packData) {
                document.getElementById('dateRangeSection').style.display = 'block';
                renderDailySummary();
                console.log('Packing data loaded from main page');
                return true;
            }
        } else {
            const noDataMsg = document.getElementById('noDataMessage');
            if (noDataMsg) {
                noDataMsg.style.display = 'block';
            }
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
        const noDataMsg = document.getElementById('noDataMessage');
        if (noDataMsg) {
            noDataMsg.style.display = 'block';
        }
    }
    return false;
}

// Clear loaded data
function clearLoadedData() {
    if (confirm('Are you sure you want to clear all loaded data?')) {
        localStorage.removeItem('sharedExcelData');
        packData = null;

        document.getElementById('output').innerHTML = '';
        document.getElementById('summaryCards').style.display = 'none';
        document.getElementById('lineWiseSummary').style.display = 'none';
        document.getElementById('dateRangeSection').style.display = 'none';
        document.getElementById('dataStatusMessage').style.display = 'none';
        document.getElementById('fromDate').value = '';
        document.getElementById('toDate').value = '';
        document.getElementById('lineFilter').value = '';

        const noDataMsg = document.getElementById('noDataMessage');
        if (noDataMsg) {
            noDataMsg.style.display = 'block';
        }

        alert('All data has been cleared! Please upload files on the main page.');
    }
}

// Auto-load data on page load
window.addEventListener('DOMContentLoaded', function () {
    loadFromLocalStorage();
});


function renderDailySummary(fromDate = null, toDate = null, lineFilter = null) {
    const out = document.getElementById('output');
    out.innerHTML = '';

    if (!packData) {
        out.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px">Please upload files first.</p>';
        document.getElementById('summaryCards').style.display = 'none';
        document.getElementById('lineWiseSummary').style.display = 'none';
        return;
    }

    const dateSummary = {};
    let overallTotalPacking = 0;

    // Process packing data
    packData.forEach(row => {
        const dateStr = row.date;

        if (fromDate && dateStr < fromDate) return;
        if (toDate && dateStr > toDate) return;

        if (lineFilter) {
            const rowLine = String(row.line || 'N/A').trim();
            const filterLine = lineFilter.trim();
            if (rowLine.toUpperCase() !== filterLine.toUpperCase()) return;
        }

        if (!dateSummary[dateStr]) dateSummary[dateStr] = { packing: {}, totalPacking: 0 };

        const key = `${row.oc}|${row.style}|${row.po}|${row.country}|${row.colour}|${row.line || 'N/A'}`;
        if (!dateSummary[dateStr].packing[key]) {
            dateSummary[dateStr].packing[key] = {
                oc: row.oc,
                style: row.style,
                po: row.po,
                country: row.country,
                colour: row.colour,
                line: row.line || 'N/A',
                qty: 0
            };
        }
        dateSummary[dateStr].packing[key].qty += row.qty;
        dateSummary[dateStr].totalPacking += row.qty;
    });

    const sortedDates = Object.keys(dateSummary).sort();

    if (sortedDates.length === 0) {
        out.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px">No data found in the selected date range.</p>';
        document.getElementById('summaryCards').style.display = 'none';
        return;
    }

    // Calculate overall totals
    sortedDates.forEach(date => {
        overallTotalPacking += dateSummary[date].totalPacking;
    });

    // Display overall summary cards
    const summaryCardsContent = document.getElementById('summaryCardsContent');
    const avgPackingPerDay = sortedDates.length > 0 ? (overallTotalPacking / sortedDates.length).toFixed(0) : 0;

    summaryCardsContent.innerHTML = `
        <div class="summary-card" style="border-left-color:#007bff;flex:1;min-width:200px">
            <h4>Total Packing</h4>
            <p class="count" style="font-size:2em;margin:10px 0">${overallTotalPacking.toLocaleString()}</p>
            <p style="font-size:0.9em;color:#666">Across ${sortedDates.length} date(s)</p>
        </div>
        <div class="summary-card" style="border-left-color:#6f42c1;flex:1;min-width:200px">
            <h4>Number of Dates</h4>
            <p class="count" style="font-size:2em;margin:10px 0">${sortedDates.length}</p>
            <p style="font-size:0.9em;color:#666">Date range covered</p>
        </div>
        <div class="summary-card" style="border-left-color:#17a2b8;flex:1;min-width:200px">
            <h4>Avg Packing/Day</h4>
            <p class="count" style="font-size:2em;margin:10px 0">${avgPackingPerDay}</p>
            <p style="font-size:0.9em;color:#666">Average per day</p>
        </div>
    `;
    document.getElementById('summaryCards').style.display = 'block';

    // Calculate and display line-wise summary
    const lineWiseData = {};

    packData.forEach(row => {
        const dateStr = row.date;

        if (fromDate && dateStr < fromDate) return;
        if (toDate && dateStr > toDate) return;

        if (lineFilter) {
            const rowLine = String(row.line || 'N/A').trim();
            const filterLine = lineFilter.trim();
            if (rowLine.toUpperCase() !== filterLine.toUpperCase()) return;
        }

        const line = row.line || 'N/A';
        if (!lineWiseData[line]) {
            lineWiseData[line] = {
                line: line,
                packingQty: 0,
                dates: new Set()
            };
        }
        lineWiseData[line].packingQty += row.qty;
        lineWiseData[line].dates.add(dateStr);
    });

    // Display line-wise summary
    if (Object.keys(lineWiseData).length > 0) {
        const lineWiseSummaryContent = document.getElementById('lineWiseSummaryContent');
        let lineHtml = `
            <table style="width:100%;border-collapse:collapse;margin-top:10px">
                <thead>
                    <tr style="background:#f8f9fa;border-bottom:2px solid #dee2e6">
                        <th style="padding:12px;text-align:left;border:1px solid #dee2e6">LINE</th>
                        <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Packing Qty</th>
                        <th style="padding:12px;text-align:center;border:1px solid #dee2e6">Dates Covered</th>
                        <th style="padding:12px;text-align:right;border:1px solid #dee2e6">Avg Packing/Day</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const sortedLines = Object.keys(lineWiseData).sort((a, b) => {
            const lineA = String(a || 'N/A');
            const lineB = String(b || 'N/A');
            return lineA.localeCompare(lineB);
        });

        let totalPacking = 0;

        sortedLines.forEach(line => {
            const data = lineWiseData[line];
            const avgPerDay = data.dates.size > 0 ? (data.packingQty / data.dates.size).toFixed(0) : 0;

            totalPacking += data.packingQty;

            lineHtml += `
                <tr style="border-bottom:1px solid #dee2e6">
                    <td style="padding:10px;border:1px solid #dee2e6;font-weight:bold">${data.line}</td>
                    <td style="padding:10px;border:1px solid #dee2e6;text-align:right;color:#007bff;font-weight:bold">${data.packingQty.toLocaleString()}</td>
                    <td style="padding:10px;border:1px solid #dee2e6;text-align:center">${data.dates.size}</td>
                    <td style="padding:10px;border:1px solid #dee2e6;text-align:right">${avgPerDay}</td>
                </tr>
            `;
        });

        lineHtml += `
                    <tr style="background:#f0f0f0;font-weight:bold;border-top:2px solid #dee2e6">
                        <td style="padding:12px;border:1px solid #dee2e6">TOTAL</td>
                        <td style="padding:12px;border:1px solid #dee2e6;text-align:right;color:#007bff">${totalPacking.toLocaleString()}</td>
                        <td style="padding:12px;border:1px solid #dee2e6;text-align:center">-</td>
                        <td style="padding:12px;border:1px solid #dee2e6;text-align:right">-</td>
                    </tr>
                </tbody>
            </table>
        `;

        lineWiseSummaryContent.innerHTML = lineHtml;
        document.getElementById('lineWiseSummary').style.display = 'block';
    } else {
        document.getElementById('lineWiseSummary').style.display = 'none';
    }

    // Render each date
    sortedDates.forEach(date => {
        const data = dateSummary[date];
        let html = `<div class="daily-section">`;
        html += `<div class="date-header">Date: ${date}</div>`;

        html += `<div style="display:flex;gap:20px;margin-bottom:15px">`;
        html += `<div style="background:#d1ecf1;padding:10px 15px;border-radius:5px;border-left:4px solid #007bff">`;
        html += `<strong>Total Packing Done:</strong> <span style="font-size:20px;font-weight:bold;color:#007bff">${data.totalPacking}</span>`;
        html += `</div>`;
        html += `</div>`;

        // Packing Summary
        if (Object.keys(data.packing).length > 0) {
            html += `<h4>Packing Summary <span class="type-badge packing">PACKING</span></h4>`;
            html += `<table class="summary-table">`;
            html += `<tr><th>LINE</th><th>OC</th><th>Style</th><th>PO</th><th>Country</th><th>Colour</th><th>Quantity</th></tr>`;

            Object.values(data.packing).sort((a, b) => {
                const lineA = String(a.line || 'N/A');
                const lineB = String(b.line || 'N/A');
                if (lineA !== lineB) return lineA.localeCompare(lineB);

                const ocA = String(a.oc || '');
                const ocB = String(b.oc || '');
                if (ocA !== ocB) return ocA.localeCompare(ocB);

                const styleA = String(a.style || '');
                const styleB = String(b.style || '');
                if (styleA !== styleB) return styleA.localeCompare(styleB);

                const poA = String(a.po || '');
                const poB = String(b.po || '');
                if (poA !== poB) return poA.localeCompare(poB);

                const colourA = String(a.colour || '');
                const colourB = String(b.colour || '');
                return colourA.localeCompare(colourB);
            }).forEach(item => {
                html += `<tr>`;
                html += `<td>${item.line}</td>`;
                html += `<td>${item.oc}</td>`;
                html += `<td>${item.style}</td>`;
                html += `<td>${item.po}</td>`;
                html += `<td>${item.country}</td>`;
                html += `<td>${item.colour}</td>`;
                html += `<td><strong>${item.qty}</strong></td>`;
                html += `</tr>`;
            });

            html += `<tr style="background:#f0f0f0;font-weight:bold">`;
            html += `<td colspan="6">Total Packing</td>`;
            html += `<td>${data.totalPacking}</td>`;
            html += `</tr>`;
            html += `</table>`;
        }

        html += `</div>`;
        out.innerHTML += html;
    });
}

// Switch between daily and merged view
function switchView(view) {
    currentView = view;

    const dailyBtn = document.getElementById('dailyViewBtn');
    const mergedBtn = document.getElementById('mergedViewBtn');

    if (view === 'daily') {
        dailyBtn.style.background = '#17a2b8';
        mergedBtn.style.background = '#6c757d';
    } else {
        dailyBtn.style.background = '#6c757d';
        mergedBtn.style.background = '#17a2b8';
    }

    applyFilters();
}

// Render merged view
function renderMergedView(fromDate = null, toDate = null, lineFilter = null) {
    const out = document.getElementById('output');
    out.innerHTML = '';

    if (!packData) {
        out.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px">Please upload files first.</p>';
        return;
    }

    const mergedData = {};

    packData.forEach(row => {
        const dateStr = row.date;

        if (fromDate && dateStr < fromDate) return;
        if (toDate && dateStr > toDate) return;
        if (lineFilter) {
            const rowLine = String(row.line || 'N/A').trim();
            const filterLine = lineFilter.trim();
            if (rowLine.toUpperCase() !== filterLine.toUpperCase()) return;
        }

        const key = `${row.oc}|${row.style}|${row.po}|${row.country}|${row.colour}`;
        if (!mergedData[key]) {
            mergedData[key] = {
                oc: row.oc,
                style: row.style,
                po: row.po,
                country: row.country,
                colour: row.colour,
                line: row.line || 'N/A',
                sizes: {}
            };
            SIZES.forEach(size => {
                mergedData[key].sizes[size] = 0;
            });
        }

        mergedData[key].sizes[row.size] = (mergedData[key].sizes[row.size] || 0) + row.qty;
    });

    if (Object.keys(mergedData).length === 0) {
        out.innerHTML = '<p style="color:#999;font-weight:bold;margin-top:20px">No data found matching the selected filters.</p>';
        return;
    }

    let html = '<div class="daily-section">';
    html += '<div class="date-header">Merged Packing Summary (All Dates Combined)</div>';
    html += '<table class="summary-table" style="font-size:12px">';
    html += '<thead><tr style="background:#f8f9fa">';
    html += '<th style="position:sticky;left:0;background:#f8f9fa;z-index:2">LINE</th>';
    html += '<th style="position:sticky;left:50px;background:#f8f9fa;z-index:2">OC</th>';
    html += '<th style="position:sticky;left:100px;background:#f8f9fa;z-index:2">Style</th>';
    html += '<th>PO</th>';
    html += '<th>Country</th>';
    html += '<th>Colour</th>';

    SIZES.forEach(size => {
        html += `<th>${size}</th>`;
    });
    html += '<th>TOTAL</th>';
    html += '</tr></thead><tbody>';

    const sortedKeys = Object.keys(mergedData).sort((a, b) => {
        const [ocA, styleA, poA] = a.split('|');
        const [ocB, styleB, poB] = b.split('|');
        if (ocA !== ocB) return String(ocA).localeCompare(String(ocB));
        if (styleA !== styleB) return String(styleA).localeCompare(String(styleB));
        return String(poA).localeCompare(String(poB));
    });

    sortedKeys.forEach(key => {
        const data = mergedData[key];

        let packTotal = 0;
        html += '<tr>';
        html += `<td style="position:sticky;left:0;background:white">${data.line}</td>`;
        html += `<td style="position:sticky;left:50px;background:white">${data.oc}</td>`;
        html += `<td style="position:sticky;left:100px;background:white">${data.style}</td>`;
        html += `<td>${data.po}</td>`;
        html += `<td>${data.country}</td>`;
        html += `<td>${data.colour}</td>`;

        SIZES.forEach(size => {
            const qty = data.sizes[size] || 0;
            packTotal += qty;
            html += `<td style="text-align:center">${qty > 0 ? qty : '-'}</td>`;
        });
        html += `<td style="font-weight:bold;background:#d1ecf1">${packTotal}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    out.innerHTML = html;
}

function applyFilters() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const lineFilter = document.getElementById('lineFilter').value.trim();

    if (fromDate && toDate && fromDate > toDate) {
        alert('From Date cannot be after To Date');
        return;
    }

    if (currentView === 'merged') {
        renderMergedView(fromDate || null, toDate || null, lineFilter || null);
    } else {
        renderDailySummary(fromDate || null, toDate || null, lineFilter || null);
    }
}

function clearFilters() {
    document.getElementById('fromDate').value = '';
    document.getElementById('toDate').value = '';
    document.getElementById('lineFilter').value = '';

    if (currentView === 'merged') {
        renderMergedView();
    } else {
        renderDailySummary();
    }
}

// Export to PDF
async function exportToPDF() {
    if (!packData) {
        alert('Please upload files first!');
        return;
    }

    const output = document.getElementById('output');
    if (!output.innerHTML) {
        alert('No data to export.');
        return;
    }

    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:9999;';
    loadingMsg.innerHTML = '<h3>Generating PDF...</h3><p>Please wait...</p>';
    document.body.appendChild(loadingMsg);

    try {
        const container = document.createElement('div');
        container.innerHTML = document.getElementById('summaryCards').outerHTML + output.outerHTML;

        const canvas = await html2canvas(container, {
            scale: 1.5,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4', true);

        const imgWidth = 210;
        const pageHeight = 297;
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

        const fileName = `Daily_Packing_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Error generating PDF.');
    } finally {
        document.body.removeChild(loadingMsg);
    }
}

// Export to Excel
function exportToExcel() {
    if (!packData) {
        alert('Please upload files first!');
        return;
    }

    const exportData = [];

    packData.forEach(row => {
        exportData.push({
            'Date': row.date,
            'LINE': row.line || 'N/A',
            'OC': row.oc,
            'Style': row.style,
            'PO': row.po,
            'Country': row.country,
            'Colour': row.colour,
            'Size': row.size,
            'Quantity': row.qty
        });
    });

    if (exportData.length === 0) {
        alert('No data to export.');
        return;
    }

    exportData.sort((a, b) => {
        if (a.Date !== b.Date) return a.Date.localeCompare(b.Date);
        return 0;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = [
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Packing Summary');

    const fileName = `Daily_Packing_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}
