module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MerchantDash
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/Bits-eateries-ordering-app/campus-eats/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// ... (keep existing imports)
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/Bits-eateries-ordering-app/campus-eats/node_modules/firebase/firestore/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/Bits-eateries-ordering-app/campus-eats/node_modules/@firebase/firestore/dist/index.node.mjs [app-ssr] (ecmascript)");
"use client";
;
;
function MerchantDash() {
    // ... (keep state and auth logic)
    useEffect(()=>{
        // ... (keep auth check)
        // 2. Updated Query: Listen for orders waiting for payment confirmation
        const q = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["query"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(db, "orders"), (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["where"])("status", "in", [
            "AWAITING_PAYMENT",
            "PAID"
        ]));
        const unsubscribeOrders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["onSnapshot"])(q, (snap)=>{
            // Play sound for new orders
            if (snap.docChanges().some((c)=>c.type === "added")) {
                audioRef.current?.play().catch(()=>{});
            }
            setOrders(snap.docs.map((d)=>({
                    ...d.data(),
                    id: d.id
                })));
        });
        return ()=>{
            unsubscribeAuth();
            unsubscribeOrders();
        };
    }, [
        router
    ]);
    // Handle Payment Confirmation
    const handlePaymentStatus = async (id, newStatus)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(db, "orders", id), {
            status: newStatus
        });
    };
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "p-10 text-center text-gray-500",
        children: "Verifying session..."
    }, void 0, false, {
        fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
        lineNumber: 36,
        columnNumber: 23
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-md mx-auto p-6 bg-gray-100 min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold mb-6",
                children: "Store Dashboard"
            }, void 0, false, {
                fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            orders.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-400 text-center mt-10",
                children: "No orders to process"
            }, void 0, false, {
                fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                lineNumber: 42,
                columnNumber: 30
            }, this) : orders.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white p-5 rounded-2xl shadow-md mb-4 border-l-8 border-orange-500",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-start mb-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-black text-xl text-gray-800",
                                    children: o.orderId
                                }, void 0, false, {
                                    fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                                    lineNumber: 46,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-md font-bold uppercase",
                                    children: o.status.replace('_', ' ')
                                }, void 0, false, {
                                    fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                                    lineNumber: 47,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                            lineNumber: 45,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600 mb-1 font-semibold",
                            children: [
                                "Total: ₹",
                                o.total
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                            lineNumber: 52,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-500 mb-4 pb-4 border-b",
                            children: o.items.map((i)=>`${i.name}`).join(', ')
                        }, void 0, false, {
                            fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                            lineNumber: 53,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handlePaymentStatus(o.id, "CONFIRMED"),
                                    className: "flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-sm",
                                    children: "Accept Payment"
                                }, void 0, false, {
                                    fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                                    lineNumber: 58,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handlePaymentStatus(o.id, "REJECTED"),
                                    className: "px-4 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200",
                                    children: "Reject"
                                }, void 0, false, {
                                    fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                                    lineNumber: 64,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                            lineNumber: 57,
                            columnNumber: 13
                        }, this)
                    ]
                }, o.id, true, {
                    fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
                    lineNumber: 44,
                    columnNumber: 11
                }, this))
        ]
    }, void 0, true, {
        fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/merchant/dashboard/page.js",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__35287111._.js.map