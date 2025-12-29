const XLSX = require('xlsx');

// Demo data structure
const demoData = {
    order: [
        ['OC', 'LINE', 'STYLE', 'PO', 'COUNTRY', 'COLOUR', 'COLOUR NAME', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
        ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-001', 'USA', 'C01', 'Navy Blue', 100, 200, 300, 250, 150, 50],
        ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-002', 'UK', 'C02', 'Black', 80, 150, 200, 180, 100, 40],
        ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-003', 'Canada', 'C01', 'Navy Blue', 120, 180, 220, 200, 130, 60],
        ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-004', 'Australia', 'C03', 'Red', 90, 140, 180, 160, 110, 50],
        ['OC003', 'LINE-C', 'ST-11111', 'PO-2024-005', 'Germany', 'C01', 'Navy Blue', 110, 170, 210, 190, 120, 55],
    ],
    loading: [
        ['OC', 'LINE', 'STYLE', 'PO', 'COUNTRY', 'COLOUR', 'COLOUR NAME', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
        ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-001', 'USA', 'C01', 'Navy Blue', 80, 180, 250, 200, 120, 40],
        ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-002', 'UK', 'C02', 'Black', 60, 120, 150, 140, 80, 30],
        ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-003', 'Canada', 'C01', 'Navy Blue', 100, 150, 180, 160, 100, 50],
        ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-004', 'Australia', 'C03', 'Red', 70, 110, 140, 130, 90, 40],
        ['OC003', 'LINE-C', 'ST-11111', 'PO-2024-005', 'Germany', 'C01', 'Navy Blue', 90, 140, 170, 150, 100, 45],
    ],
    packing: [
        ['OC', 'LINE', 'STYLE', 'PO', 'COUNTRY', 'COLOUR', 'COLOUR NAME', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
        ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-001', 'USA', 'C01', 'Navy Blue', 70, 160, 220, 180, 100, 35],
        ['OC001', 'LINE-A', 'ST-12345', 'PO-2024-002', 'UK', 'C02', 'Black', 50, 100, 130, 120, 70, 25],
        ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-003', 'Canada', 'C01', 'Navy Blue', 90, 130, 160, 140, 90, 45],
        ['OC002', 'LINE-B', 'ST-67890', 'PO-2024-004', 'Australia', 'C03', 'Red', 60, 95, 120, 110, 75, 35],
        ['OC003', 'LINE-C', 'ST-11111', 'PO-2024-005', 'Germany', 'C01', 'Navy Blue', 80, 120, 150, 130, 85, 40],
    ]
};

// Create demo-files directory if it doesn't exist
const fs = require('fs');
const demoDir = './demo-files';
if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir);
}

// Generate each file
Object.keys(demoData).forEach(fileType => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(demoData[fileType]);

    // Set column widths
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
        { wch: 6 },  // XXL
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const filename = `${demoDir}/demo-${fileType}.xlsx`;
    XLSX.writeFile(wb, filename);
    console.log(`✅ Created: ${filename}`);
});

console.log('\n🎉 All demo files created successfully!');
console.log('📁 Location: ./demo-files/');
console.log('\nFiles created:');
console.log('  - demo-order.xlsx');
console.log('  - demo-loading.xlsx');
console.log('  - demo-packing.xlsx');
