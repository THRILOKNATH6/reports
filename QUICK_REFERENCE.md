# 📋 Quick Reference - Excel File Requirements

## ✅ **Required Columns (All 3 Files)**

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┬─────────────────┐
│    OC    │   LINE   │  STYLE   │    PO    │ COUNTRY  │  COLOUR  │ COLOUR NAME  │  SIZE COLUMNS   │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────────┼─────────────────┤
│  Text    │   Text   │   Text   │   Text   │   Text   │   Text   │     Text     │    Numbers      │
│ Required │ Required │ Required │ Required │ Required │ Required │   Required   │    Required     │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────────┴─────────────────┘
```

## 📏 **Size Columns Examples**

Choose ONE format and use consistently:

**Option A - Letter Sizes:**
```
XS | S | M | L | XL | XXL | 2XL | 3XL | 4XL | 5XL
```

**Option B - Numeric Sizes:**
```
28 | 30 | 32 | 34 | 36 | 38 | 40 | 42 | 44 | 46
```

**Option C - Mixed (if needed):**
```
XS | S | M | L | XL | 2XL | 3XL
```

## 🎯 **Matching Rules**

Records must match across all 3 files using:

```
OC + STYLE + PO + COUNTRY + COLOUR = Unique Record
```

**Example:**
```
✅ MATCH:
Order:   OC001 | ST-12345 | PO-2024-001 | USA | C01
Loading: OC001 | ST-12345 | PO-2024-001 | USA | C01
Packing: OC001 | ST-12345 | PO-2024-001 | USA | C01

❌ NO MATCH:
Order:   OC001 | ST-12345 | PO-2024-001 | USA | C01
Loading: OC001 | ST-12345 | PO-2024-002 | USA | C01  (Different PO!)
```

## 📊 **Data Types**

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| OC | Text | OC001 | Order code |
| LINE | Text | LINE-A | Production line |
| STYLE | Text | ST-12345 | Style number |
| PO | Text | PO-2024-001 | Purchase order |
| COUNTRY | Text | USA | Destination |
| COLOUR | Text | C01 | Color code |
| COLOUR NAME | Text | Navy Blue | Color description |
| Size Columns | Number | 100, 200, 300 | Quantities |

## ⚠️ **Common Mistakes**

| ❌ Wrong | ✅ Right | Issue |
|---------|---------|-------|
| `oc` | `OC` | Case sensitive |
| `Color` | `COLOUR` | Spelling matters |
| `PO Number` | `PO` | Exact name required |
| Missing column | All columns present | Must have all |
| Different sizes | Same sizes in all files | Must match |

## 🔢 **Sample Data**

**Order File (1000 pcs ordered):**
```
OC001 | LINE-A | ST-12345 | PO-001 | USA | C01 | Navy | 100 | 200 | 300 | 250 | 150
```

**Loading File (800 pcs loaded = 80%):**
```
OC001 | LINE-A | ST-12345 | PO-001 | USA | C01 | Navy | 80 | 180 | 250 | 200 | 90
```

**Packing File (700 pcs packed = 70%):**
```
OC001 | LINE-A | ST-12345 | PO-001 | USA | C01 | Navy | 70 | 160 | 220 | 180 | 70
```

## 💡 **Quick Checklist**

Before uploading, verify:

- [ ] All 3 files have same column headers
- [ ] Headers are in first row
- [ ] Column names match exactly (case-sensitive)
- [ ] Size columns are same across all files
- [ ] Same records exist in all 3 files
- [ ] Numbers are in size columns (not text)
- [ ] Files are .xlsx format (or CSV)
- [ ] No extra rows before headers

## 🚀 **Ready to Go?**

1. ✅ Use demo files as templates
2. ✅ Replace with your data
3. ✅ Keep same structure
4. ✅ Upload and test!

---

**See `EXCEL_FILE_STRUCTURE.md` for detailed guide**  
**See `demo-files/` folder for sample files**
