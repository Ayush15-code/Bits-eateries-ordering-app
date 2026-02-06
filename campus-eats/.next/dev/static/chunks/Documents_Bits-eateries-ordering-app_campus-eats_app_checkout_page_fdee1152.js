(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Checkout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/Bits-eateries-ordering-app/campus-eats/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/Bits-eateries-ordering-app/campus-eats/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/Bits-eateries-ordering-app/campus-eats/node_modules/next/navigation.js [app-client] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@/lib/firebase'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/Bits-eateries-ordering-app/campus-eats/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/Bits-eateries-ordering-app/campus-eats/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function Checkout() {
    _s();
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [total, setTotal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Checkout.useEffect": ()=>{
            const savedCart = JSON.parse(localStorage.getItem('pending_cart') || '[]');
            const savedTotal = localStorage.getItem('pending_total') || '0';
            setCart(savedCart);
            setTotal(savedTotal);
        }
    }["Checkout.useEffect"], []);
    const handleFinalPayment = async ()=>{
        try {
            const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(db, "orders"), {
                items: cart,
                total: total,
                status: "PAID",
                createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
            });
            localStorage.removeItem('pending_cart');
            router.push(`/status/${docRef.id}`);
        } catch (e) {
            alert("Payment Error: Make sure your Firebase is connected!");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-md mx-auto p-6 bg-gray-50 min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold mb-6",
                children: "Review Items"
            }, void 0, false, {
                fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl p-4 shadow-sm mb-6",
                children: [
                    cart.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between py-2 border-b last:border-0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: item.name
                                }, void 0, false, {
                                    fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                                    lineNumber: 42,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-bold",
                                    children: [
                                        "₹",
                                        item.price
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                                    lineNumber: 43,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, index, true, {
                            fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between mt-4 text-xl font-bold border-t pt-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Total"
                            }, void 0, false, {
                                fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                                lineNumber: 47,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-orange-600",
                                children: [
                                    "₹",
                                    total
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                                lineNumber: 48,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleFinalPayment,
                className: "w-full bg-green-600 text-white p-4 rounded-2xl font-bold shadow-lg",
                children: "Make Full Payment"
            }, void 0, false, {
                fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
                lineNumber: 52,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Documents/Bits-eateries-ordering-app/campus-eats/app/checkout/page.js",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_s(Checkout, "aVXkkTsAKLwvX6zEyqtnLvsW+ZE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$Bits$2d$eateries$2d$ordering$2d$app$2f$campus$2d$eats$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Checkout;
var _c;
__turbopack_context__.k.register(_c, "Checkout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Documents_Bits-eateries-ordering-app_campus-eats_app_checkout_page_fdee1152.js.map