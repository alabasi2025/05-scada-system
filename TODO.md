# ✅ قائمة المهام لنظام المراقبة والتحكم (TODO)

هذا الملف يوضح الفجوات بين ما تم بناؤه وما هو مطلوب في `05_نظام_المراقبة_والتحكم.md`.

---

## 1. Backend (NestJS)

| الوحدة | الحالة | ملاحظات |
|--------|--------|-----------|
| **SCADA** | ✅ مكتمل | `stations`, `devices`, `monitoring_points`, `live_readings`, `readings_history`, `alerts`, `control_commands` |
| **الطاقة** | ✅ مكتمل | `energy_summary` |
| **الجودة** | ✅ مكتمل | `quality_metrics`, `reliability_metrics` (في Schema) |
| **الحوادث والسلامة** | ✅ مكتمل | `incidents`, `safety_inspections` |
| **الأمان** | ✅ مكتمل | `cameras`, `camera_events`, `access_log`, `security_alerts` (في Schema) |
| **التكاملات** | ✅ مكتمل | `integrated_devices`, `device_communication_log`, `sync_tasks`, `meter_control_log` |
| **التوأم الرقمي** | ✅ مكتمل | `network_nodes`, `node_components`, `network_segments`, `geo_locations` |

### APIs المتاحة

```
GET  /api/api/v1/health                              - فحص صحة النظام
GET  /api/api/v1/scada/stations                      - قائمة المحطات
GET  /api/api/v1/scada/devices                       - قائمة الأجهزة
GET  /api/api/v1/scada/monitoring-points             - نقاط المراقبة
GET  /api/api/v1/scada/readings                      - القراءات
GET  /api/api/v1/scada/alerts                        - التنبيهات
GET  /api/api/v1/scada/commands                      - أوامر التحكم
GET  /api/api/v1/scada/energy                        - ملخص الطاقة
GET  /api/api/v1/incidents                           - الحوادث
GET  /api/api/v1/safety-inspections                  - فحوصات السلامة
GET  /api/api/v1/digital-twin/nodes                  - عقد الشبكة
GET  /api/api/v1/digital-twin/segments               - مقاطع الشبكة
GET  /api/api/v1/digital-twin/stats                  - إحصائيات الشبكة
GET  /api/api/v1/integrations/acrel/devices          - أجهزة Acrel
GET  /api/api/v1/integrations/acrel/sync-tasks       - مهام المزامنة
```

---

## 2. Frontend (Angular)

| الشاشة | الحالة | ملاحظات |
|--------|--------|-----------|
| **SCADA Dashboard** | ❌ يحتاج إعادة بناء | إعادة تصميم احترافي باستخدام **PrimeNG** |
| **قائمة المحطات** | ❌ يحتاج إعادة بناء | استخدام PrimeNG DataTable |
| **تفاصيل المحطة** | ❌ يحتاج إعادة بناء | قراءات حية ورسوم بيانية |
| **خريطة المحطات** | ❌ غير موجود | خريطة تفاعلية Leaflet |
| **إدارة التنبيهات** | ❌ يحتاج إعادة بناء | قائمة واعتراف ومسح |
| **أوامر التحكم** | ❌ يحتاج إعادة بناء | بوابة الأوامر الآمنة |
| **Power Quality** | ❌ غير موجود | لوحة تحليل جودة الطاقة |
| **Digital Twin** | ❌ غير موجود | أداة رسم الشبكة الكهربائية |
| **الحوادث** | ❌ غير موجود | إدارة الحوادث |
| **فحوصات السلامة** | ❌ غير موجود | جدولة وتتبع الفحوصات |
| **التكاملات** | ❌ غير موجود | إدارة الأجهزة المتكاملة |

---

## 3. القواعد الصارمة

| القاعدة | الامتثال | الإجراء المطلوب |
|----------|-----------|-----------------|
| **PrimeNG** | ❌ لا | استبدال المكونات الحالية بمكونات PrimeNG |
| **Loading States** | ❌ لا | إضافة مؤشرات التحميل في جميع الشاشات |
| **Error Handling** | ❌ لا | عرض رسائل الخطأ من الـ Backend بشكل واضح |
| **لا بيانات وهمية** | ✅ نعم | جميع البيانات من قاعدة البيانات |
| **CRUD كامل** | ✅ نعم | جميع APIs تدعم CRUD |

---

## 4. خطة العمل التالية

### المرحلة التالية: بناء Frontend بـ PrimeNG

1. **[ ]** تثبيت PrimeNG و PrimeIcons و PrimeFlex
2. **[ ]** إنشاء Angular Services للاتصال بـ APIs
3. **[ ]** بناء لوحة SCADA الرئيسية (Dashboard)
4. **[ ]** بناء شاشة قائمة المحطات (DataTable)
5. **[ ]** بناء شاشة تفاصيل المحطة (Charts + Live Data)
6. **[ ]** بناء شاشة التنبيهات
7. **[ ]** بناء شاشة أوامر التحكم
8. **[ ]** بناء خريطة المحطات (Leaflet)
9. **[ ]** بناء شاشة التوأم الرقمي
10. **[ ]** بناء شاشات الحوادث والسلامة

---

آخر تحديث: 2025-12-18
