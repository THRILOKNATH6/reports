// Quick test of dynamic size detection
const testData = [
    ['OC', 'STYLE', 'PO', 'COUNTRY', 'COLOUR', 'XS', 'S', 'M', 'L', 'XL'],
    ['OC001', 'ST-123', 'PO-001', 'USA', 'C01', 100, 200, 300, 250, 150]
];

const headers = testData[0].map(h => String(h).trim().toUpperCase());
const fixedColumns = ['OC', 'STYLE', 'PO NO', 'PO', 'COUNTRY', 'COLOUR', 'LINE', 'COLOUR NAME', 'DATE'];
const sizeColumns = [];

headers.forEach((header, index) => {
    const headerUpper = String(header).trim().toUpperCase();
    if (!fixedColumns.includes(headerUpper) && headerUpper) {
        const originalHeader = testData[0][index];
        sizeColumns.push(originalHeader);
        console.log(`Found size column: ${originalHeader} at index ${index}`);
    }
});

console.log(`\n📏 Total detected: ${sizeColumns.length} size columns`);
console.log('Size columns:', sizeColumns);
