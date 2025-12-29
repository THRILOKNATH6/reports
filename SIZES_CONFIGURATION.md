# 📏 Size Columns Configuration Guide

## 📁 File: `sizes-config.js`

This file contains all the size columns that your application will recognize in Excel files.

## ✏️ How to Add/Edit Sizes:

### **Step 1: Open the file**
```
sizes-config.js
```

### **Step 2: Find the SIZES array**
```javascript
const SIZES = [
    "XS", 
    "S", 
    "M", 
    "L", 
    "XL",
    // Add your sizes here
];
```

### **Step 3: Add your size**
```javascript
const SIZES = [
    "XS", 
    "S", 
    "M", 
    "L", 
    "XL",
    "48",     // ← Add new size
    "50",     // ← Add new size
];
```

### **Step 4: Save and refresh**
- Save the file
- Refresh browser (F5)
- Your new sizes are now recognized!

## 📋 **Examples:**

### **Letter Sizes:**
```javascript
"XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"
```

### **Numeric Sizes:**
```javascript
"28", "30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50"
```

### **Plus Sizes:**
```javascript
"1X", "2X", "3X", "4X", "5X", "6X"
```

### **Tall Sizes:**
```javascript
"LT", "XLT", "2XT", "3XT", "4XT"
```

### **International Sizes:**
```javascript
"UK8", "UK10", "UK12", "UK14", "UK16"
"EU38", "EU40", "EU42", "EU44", "EU46"
```

### **Custom Sizes:**
```javascript
"ONESIZE", "FREE", "SMALL", "MEDIUM", "LARGE"
```

## ⚠️ **Important Rules:**

1. **Case Sensitive** - Must match your Excel headers exactly
   - ✅ If Excel has "XS", use "XS"
   - ❌ Don't use "xs" if Excel has "XS"

2. **Exact Match** - Must be identical to column header
   - ✅ If Excel has "2XL", use "2XL"
   - ❌ Don't use "XXL" if Excel has "2XL"

3. **Use Quotes** - All sizes must be in quotes
   - ✅ "M", "L", "XL"
   - ❌ M, L, XL (without quotes)

4. **Comma Separated** - Add comma after each size
   - ✅ "S", "M", "L",
   - ❌ "S" "M" "L" (missing commas)

## 💡 **Tips:**

### **Tip 1: Check Your Excel Files**
Open your Excel files and look at the column headers. Add exactly those names to the SIZES array.

### **Tip 2: Remove Unused Sizes**
If you don't use certain sizes, remove them from the array. This improves performance.

### **Tip 3: Order Matters**
Sizes will appear in tables in the order you list them here.

### **Tip 4: Comments**
You can add comments to organize:
```javascript
const SIZES = [
    // Standard sizes
    "S", "M", "L", "XL",
    
    // Extended sizes
    "2XL", "3XL", "4XL",
    
    // Numeric sizes
    "28", "30", "32",
];
```

## 🔧 **Common Scenarios:**

### **Scenario 1: Adding a New Size**
Your factory starts using size "6XL":
```javascript
const SIZES = [
    "XS", "S", "M", "L", "XL", "XXL",
    "2XL", "3XL", "4XL", "5XL",
    "6XL",  // ← Add this
];
```

### **Scenario 2: Switching to Numeric Sizes**
You change from letter to numeric sizes:
```javascript
const SIZES = [
    // Old letter sizes (comment out or remove)
    // "XS", "S", "M", "L", "XL",
    
    // New numeric sizes
    "28", "30", "32", "34", "36", "38", "40",
];
```

### **Scenario 3: Mixed Sizes**
You use both letter and numeric:
```javascript
const SIZES = [
    // Letter sizes
    "XS", "S", "M", "L", "XL",
    
    // Numeric sizes
    "28", "30", "32", "34", "36",
];
```

## 🎯 **Quick Reference:**

| Your Excel Has | Add to SIZES |
|----------------|--------------|
| XS, S, M, L | `"XS", "S", "M", "L"` |
| 28, 30, 32 | `"28", "30", "32"` |
| SMALL, MEDIUM | `"SMALL", "MEDIUM"` |
| UK8, UK10 | `"UK8", "UK10"` |

## ✅ **Testing:**

After adding sizes:
1. Save `sizes-config.js`
2. Refresh browser (F5)
3. Upload your Excel files
4. Check if all sizes are recognized

## 📞 **Need Help?**

If sizes aren't being recognized:
1. Check spelling matches Excel exactly
2. Check case (uppercase/lowercase)
3. Check for extra spaces
4. Open browser console (F12) for error messages

---

**Easy to customize - just edit the array and save!** 🚀
