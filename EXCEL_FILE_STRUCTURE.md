# 📋 Excel File Templates & Structure Guide

## 📊 **Required Excel Files**

Your application needs **3 Excel files** with specific column structures:

1. **Order File** - Contains order details
2. **Loading File** - Contains loading/shipment details  
3. **Packing File** - Contains packing details

---

## 📁 **File 1: Order File**

### **Required Columns:**

| Column Name | Description | Example |
|------------|-------------|---------|
| OC | Order Code | OC001 |
| LINE | Production Line | LINE-A |
| STYLE | Style Number | ST-12345 |
| PO | Purchase Order | PO-2024-001 |
| COUNTRY | Destination Country | USA |
| COLOUR | Color Code | C01 |
| COLOUR NAME | Color Description | Navy Blue |
| Size Columns | XS, S, M, L, XL, XXL, etc. | 100, 200, 150... |

### **Example Structure:**

```
OC      | LINE   | STYLE    | PO          | COUNTRY | COLOUR | COLOUR NAME | XS  | S   | M   | L   | XL  | XXL
--------|--------|----------|-------------|---------|--------|-------------|-----|-----|-----|-----|-----|-----
OC001   | LINE-A | ST-12345 | PO-2024-001 | USA     | C01    | Navy Blue   | 100 | 200 | 300 | 250 | 150 | 50
OC001   | LINE-A | ST-12345 | PO-2024-002 | UK      | C02    | Black       | 80  | 150 | 200 | 180 | 100 | 40
OC002   | LINE-B | ST-67890 | PO-2024-003 | Canada  | C01    | Navy Blue   | 120 | 180 | 220 | 200 | 130 | 60
```

---

## 📁 **File 2: Loading File**

### **Required Columns:**

Same as Order File, but quantities represent **loaded/shipped** amounts.

| Column Name | Description | Example |
|------------|-------------|---------|
| OC | Order Code | OC001 |
| LINE | Production Line | LINE-A |
| STYLE | Style Number | ST-12345 |
| PO | Purchase Order | PO-2024-001 |
| COUNTRY | Destination Country | USA |
| COLOUR | Color Code | C01 |
| COLOUR NAME | Color Description | Navy Blue |
| Size Columns | XS, S, M, L, XL, XXL, etc. | 80, 150, 200... |

### **Example Structure:**

```
OC      | LINE   | STYLE    | PO          | COUNTRY | COLOUR | COLOUR NAME | XS  | S   | M   | L   | XL  | XXL
--------|--------|----------|-------------|---------|--------|-------------|-----|-----|-----|-----|-----|-----
OC001   | LINE-A | ST-12345 | PO-2024-001 | USA     | C01    | Navy Blue   | 80  | 180 | 250 | 200 | 120 | 40
OC001   | LINE-A | ST-12345 | PO-2024-002 | UK      | C02    | Black       | 60  | 120 | 150 | 140 | 80  | 30
OC002   | LINE-B | ST-67890 | PO-2024-003 | Canada  | C01    | Navy Blue   | 100 | 150 | 180 | 160 | 100 | 50
```

---

## 📁 **File 3: Packing File**

### **Required Columns:**

Same structure as Order and Loading files, but quantities represent **packed** amounts.

| Column Name | Description | Example |
|------------|-------------|---------|
| OC | Order Code | OC001 |
| LINE | Production Line | LINE-A |
| STYLE | Style Number | ST-12345 |
| PO | Purchase Order | PO-2024-001 |
| COUNTRY | Destination Country | USA |
| COLOUR | Color Code | C01 |
| COLOUR NAME | Color Description | Navy Blue |
| Size Columns | XS, S, M, L, XL, XXL, etc. | 70, 140, 180... |

### **Example Structure:**

```
OC      | LINE   | STYLE    | PO          | COUNTRY | COLOUR | COLOUR NAME | XS  | S   | M   | L   | XL  | XXL
--------|--------|----------|-------------|---------|--------|-------------|-----|-----|-----|-----|-----|-----
OC001   | LINE-A | ST-12345 | PO-2024-001 | USA     | C01    | Navy Blue   | 70  | 160 | 220 | 180 | 100 | 35
OC001   | LINE-A | ST-12345 | PO-2024-002 | UK      | C02    | Black       | 50  | 100 | 130 | 120 | 70  | 25
OC002   | LINE-B | ST-67890 | PO-2024-003 | Canada  | C01    | Navy Blue   | 90  | 130 | 160 | 140 | 90  | 45
```

---

## ⚙️ **Important Rules:**

### **1. Column Names (Headers)**
- ✅ Must be in **FIRST ROW**
- ✅ Must match **EXACTLY** (case-sensitive)
- ✅ Fixed columns: OC, LINE, STYLE, PO, COUNTRY, COLOUR, COLOUR NAME
- ✅ Size columns: Can be any size names (XS, S, M, L, XL, XXL, 2XL, 3XL, etc.)

### **2. Data Matching**
- ✅ Same **OC + STYLE + PO + COUNTRY + COLOUR** combination must exist in all 3 files
- ✅ LINE can be different or same
- ✅ Quantities can be different (that's what the app compares!)

### **3. Size Columns**
- ✅ All 3 files should have the **same size columns**
- ✅ Size column names must match exactly
- ✅ Common sizes: XS, S, M, L, XL, XXL, 2XL, 3XL, 4XL, 5XL
- ✅ Or numeric: 28, 30, 32, 34, 36, 38, 40, 42

### **4. Data Types**
- ✅ Text columns: OC, LINE, STYLE, PO, COUNTRY, COLOUR, COLOUR NAME
- ✅ Number columns: All size columns (XS, S, M, L, etc.)
- ✅ Empty cells = 0 (zero quantity)

---

## 📝 **Quick Setup Guide:**

### **Step 1: Create Your Files**
1. Create 3 Excel files (.xlsx)
2. Name them clearly (e.g., "Order.xlsx", "Loading.xlsx", "Packing.xlsx")

### **Step 2: Add Headers**
First row must contain:
```
OC | LINE | STYLE | PO | COUNTRY | COLOUR | COLOUR NAME | [Your Size Columns]
```

### **Step 3: Add Data**
- Each row = one order line item
- Same combination must exist in all 3 files
- Quantities can differ (that's what gets compared)

### **Step 4: Upload or Configure**
- **Option A**: Upload files directly in the app
- **Option B**: Upload to Google Sheets and configure in `sheets-config.js`

---

## 🎯 **Example Scenario:**

**Order File says:** 1000 pieces ordered  
**Loading File says:** 800 pieces loaded  
**Packing File says:** 750 pieces packed  

**App will show:**
- ✅ Order Qty: 1000
- ✅ Load Qty: 800 (80% loaded)
- ✅ Balance to Load: 200
- ✅ Pack Qty: 750 (75% packed)
- ✅ Balance to Pack: 250

---

## 💡 **Tips for Success:**

1. **Keep column names consistent** across all files
2. **Use same size columns** in all 3 files
3. **Ensure matching records** exist in all files
4. **Use 0 or leave blank** for zero quantities
5. **Test with small dataset** first

---

## 📦 **Demo Files:**

Demo Excel files with sample data are available in the `demo-files/` folder:
- `demo-order.xlsx` - Sample order file
- `demo-loading.xlsx` - Sample loading file
- `demo-packing.xlsx` - Sample packing file

You can use these as templates for your own data!

---

## ❓ **Common Questions:**

**Q: Can I add extra columns?**  
A: Yes! Extra columns will be ignored. Just ensure required columns exist.

**Q: Do size columns have to be in a specific order?**  
A: No, but keeping them consistent across files helps.

**Q: What if a record exists in Order but not in Loading?**  
A: It will show as 0% loaded (not started).

**Q: Can LINE be different across files?**  
A: Yes, LINE is informational only and doesn't affect matching.

---

**Ready to use!** Just follow this structure and your data will work perfectly! 🚀
