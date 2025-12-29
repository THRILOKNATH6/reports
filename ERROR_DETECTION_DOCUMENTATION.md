# Excel Data Error Detection System

## Overview
This document describes the error detection system implemented to identify and display data mismatches in Excel files used for order, loading, and packing comparisons.

## Problem Statement
The system needed to detect errors in Excel files where:
- **Order Quantity = 0** but **Loading Quantity > 0** (error in loading file)
- **Order Quantity = 0** but **Packing Quantity > 0** (error in packing file)

These mismatches indicate incorrect data entry in the Excel files that create wrong reports.

## Implementation Details

### 1. Error Detection Function (`detectErrors`)
**Location:** `app.js` (lines 204-240)

This function checks each size in a block for data mismatches:
```javascript
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
        orderQty, loadQty, packQty
      });
    }
    
    // Error: Order qty is 0 but packing qty > 0
    if (orderQty === 0 && packQty > 0) {
      errors.push({
        type: 'packing',
        size: size,
        message: `Packing file has quantity ${packQty} for size ${size}, but Order file has 0`,
        orderQty, loadQty, packQty
      });
    }
  });
  
  return errors;
}
```

### 2. Visual Alert Icon
**Location:** `app.js` `render()` function (lines 353-384)

When errors are detected in a block:
- A **red border** is added to the block
- A **pulsing warning icon (⚠️)** appears in the top-right corner
- The icon shows the **number of errors** in a red badge
- The icon is **clickable** to view error details

### 3. Error Popup Modal
**Location:** `app.js` `showErrorPopup()` function (lines 242-334)

When the alert icon is clicked, a modal popup displays:
- **Order Details:** OC, Style, PO, Country, Colour
- **Error Count:** Total number of errors found
- **Individual Error Cards:** For each error:
  - Error type (Loading File Error or Packing File Error)
  - Size affected
  - Detailed message
  - Comparison table showing Order Qty, Loading Qty, and Packing Qty
  - Color-coded values (red for problematic values)

### 4. Helper Functions
- **`showErrorPopupByKey(blockKey)`**: Retrieves block from mergedData and shows popup
- **`closeErrorModal()`**: Closes the error popup modal

### 5. CSS Animation
**Location:** `styles.css` (lines 319-333)

A pulse animation for the alert icon:
```css
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
```

## User Experience

### How to Use
1. **Upload Files:** Upload Order, Loading, and Packing Excel files
2. **Click Compare:** Process the files
3. **Look for Alert Icons:** Blocks with errors will show a red border and pulsing ⚠️ icon
4. **Click Alert Icon:** View detailed error information in a popup
5. **Review Errors:** Check which sizes have mismatches and in which file (loading or packing)
6. **Fix Source Files:** Correct the Excel files based on the error details

### Error Popup Features
- **Clear Error Identification:** Each error shows the type (Loading/Packing), size, and quantities
- **Visual Highlighting:** Error values are highlighted in red
- **Helpful Note:** Provides guidance on what the errors mean and how to fix them
- **Easy to Close:** Click the X button or Close button to dismiss

## Technical Notes

### Data Structure
- Errors are detected at the **size level** within each block
- Each block represents a unique combination of: OC, Style, PO, Country, Colour
- Errors are stored with: type, size, message, orderQty, loadQty, packQty

### Error Types
1. **Loading File Error:** Order Qty = 0, Loading Qty > 0
2. **Packing File Error:** Order Qty = 0, Packing Qty > 0

### Color Coding
- **Loading Errors:** Yellow background (#fff3cd), yellow border (#ffc107)
- **Packing Errors:** Pink background (#f8d7da), red border (#dc3545)
- **Alert Icon:** Red (#dc3545) with pulsing animation

## Future Enhancements (Optional)
- Add Excel row number tracking for precise error location
- Export error report to Excel
- Filter view to show only blocks with errors
- Add more error types (e.g., loading > order, packing > loading)
- Email notifications for detected errors

## Files Modified
1. **app.js** - Added error detection logic, popup modal, and helper functions
2. **styles.css** - Added pulse animation for alert icon
3. **order-load-pack-hide-zero-load.html** - No changes needed (uses existing structure)

## Testing
To test the error detection:
1. Create test data with Order Qty = 0 but Loading/Packing Qty > 0
2. Upload the files and click Compare
3. Verify alert icons appear on affected blocks
4. Click alert icons to view error details
5. Confirm error information is accurate and helpful
