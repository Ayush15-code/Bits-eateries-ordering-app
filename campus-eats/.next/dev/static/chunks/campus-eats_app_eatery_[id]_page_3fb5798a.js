(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/campus-eats/app/eatery/[id]/page.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Menu
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/campus-eats/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/campus-eats/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$router$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/campus-eats/node_modules/next/router.js [app-client] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../../lib/firebase'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/campus-eats/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/campus-eats/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const MOCK_MENU = [
    {
        id: 1,
        name: "Cheese Pizza",
        price: 150
    },
    {
        id: 2,
        name: "Veg Burger",
        price: 80
    },
    {
        id: 3,
        name: "Cold Coffee",
        price: 60
    }
];
function Menu() {
    _s();
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$router$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { id } = router.query;
    const total = cart.reduce((sum, item)=>sum + item.price, 0);
    const placeOrder = async ()=>{
        if (cart.length === 0) return;
        try {
            const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(db, "orders"), {
                orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                items: cart,
                total: total,
                status: "PAID",
                eateryId: id || "store1",
                createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
            });
            router.push(`/status/${docRef.id}`);
        } catch (e) {
            alert("Error placing order");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-md mx-auto p-6 bg-white min-h-screen pb-32",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>router.back(),
                className: "mb-4 text-orange-600 font-bold",
                children: "← Back"
            }, void 0, false, {
                fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold mb-6 capitalize",
                children: [
                    id?.replace('-', ' '),
                    " Menu"
                ]
            }, void 0, true, {
                fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            MOCK_MENU.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center border-b py-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-semibold",
                                    children: item.name
                                }, void 0, false, {
                                    fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                                    lineNumber: 43,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-orange-600 text-sm",
                                    children: [
                                        "₹",
                                        item.price
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                                    lineNumber: 44,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setCart([
                                    ...cart,
                                    item
                                ]),
                            className: "bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-bold",
                            children: "+ Add"
                        }, void 0, false, {
                            fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                            lineNumber: 46,
                            columnNumber: 11
                        }, this)
                    ]
                }, item.id, true, {
                    fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                    lineNumber: 41,
                    columnNumber: 9
                }, this)),
            cart.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed bottom-0 left-0 right-0 p-6 bg-white border-t-2 max-w-md mx-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: placeOrder,
                    className: "w-full bg-orange-500 text-white p-4 rounded-2xl font-bold shadow-lg",
                    children: [
                        "Pay ₹",
                        total,
                        " & Confirm Order"
                    ]
                }, void 0, true, {
                    fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                    lineNumber: 57,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
                lineNumber: 56,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/campus-eats/app/eatery/[id]/page.js",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_s(Menu, "0OfMQbhuFB90c9ux3F6+pyec9Co=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$campus$2d$eats$2f$node_modules$2f$next$2f$router$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Menu;
var _c;
__turbopack_context__.k.register(_c, "Menu");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=campus-eats_app_eatery_%5Bid%5D_page_3fb5798a.js.map