const SHOWCASE_ENDPOINT = "https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list";



/**
 * @description ดึงรายการสินค้าจาก TikTok Showcase
 * @param {object} options - page settings
 * @returns {Promise<object>} product list และ page token
 */
export async function fetchShowcaseProducts(options = {}) {
  // TikTok API นี้ใช้ offset และ count แทน page_token / page_size
  const offset = options.pageToken ? parseInt(options.pageToken, 10) : 0;
  const count = options.pageSize || 100;
  
  const endpoint = `${SHOWCASE_ENDPOINT}?offset=${offset}&count=${count}`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json, text/plain, */*"
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("กรุณา login TikTok (www.tiktok.com/tiktokstudio) ก่อนดึงสินค้า");
      }
      throw new Error(`HTTP ${res.status} — ดึงสินค้าไม่สำเร็จ`);
    }

    const data = await res.json();
    console.log("TikTok API Response Data:", data);

    if (data.code !== 0 && data.code !== undefined) {
      throw new Error(data.message || `API error code=${data.code}`);
    }

    const list = data.data?.products || data.data?.list || data.products || data.items || [];
    
    // คำนวณ offset สำหรับหน้าถัดไป (ถ้าดึงมาได้ครบตามจำนวน count แสดงว่ามีหน้าต่อไป)
    const nextOffset = list.length >= count ? String(offset + count) : "";

    return {
      products: list.map(normalizeProduct),
      nextPageToken: nextOffset,
      rawData: data
    };
  } catch (error) {
    throw new Error("ดึงข้อมูลล้มเหลว (ตรวจสอบว่า Login TikTok แล้วหรือยัง): " + error.message);
  }
}

/**
 * @description แปลง response จาก TikTok ให้เป็น shape เดียวกัน
 * @param {object} item - product raw item
 * @returns {object} normalized product
 */
export function normalizeProduct(item) {
  // รองรับทั้งโครงสร้างเก่าและโครงสร้างใหม่ของ Affiliate API
  const coverUrl = item.cover?.url_list?.[0] || item.images?.[0]?.url_list?.[0];
  const allImageUrls = (item.images || []).map(img => img.url_list?.[0]).filter(Boolean);
  const imageUrls = allImageUrls.length > 0 ? allImageUrls : (coverUrl ? [coverUrl] : []);

  const priceStr = (item.format_available_price || item.price?.sale_price || item.price || "").replace(/[฿$\s]/g, "");

  const commissionRateNum = item.affiliate_info?.commission_rate ?? 0;
  const commissionRate = (commissionRateNum / 1000).toFixed(1);
  const commission = item.affiliate_info?.est_commission_expense ?? "";

  return {
    productId: item.product_id || item.id || "",
    name: item.title || item.product_name || item.name || "Untitled product",
    imageUrls: imageUrls.length > 0 ? imageUrls : ["assets/icon.svg"],
    price: priceStr,
    currency: item.currency || item.price?.currency || "THB",
    stockCount: String(item.stock_num ?? item.stock_count ?? item.stock ?? 0),
    category: item.category_info?.name || item.category || "",
    shopName: item.seller_info?.shop_name || "",
    productUrl: item.product_url || item.url || "",
    commissionRate,
    commission
  };
}

/**
 * @description แปลง error response จาก TikTok เป็นข้อความที่ debug ได้
 * @param {Response} response - fetch response
 * @param {string} fallbackMessage - fallback message
 * @returns {Promise<string>} error message
 */
async function getTikTokErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json();
    const apiMessage = data.message || data.error?.message || data.error_msg || data.code || "";
    const suffix = apiMessage ? `: ${apiMessage}` : ` (HTTP ${response.status})`;
    return `${fallbackMessage}${suffix}`;
  } catch {
    return `${fallbackMessage} (HTTP ${response.status})`;
  }
}

/**
 * @description ส่งข้อความให้ background อัปโหลดวิดีโอขึ้น TikTok
 * @param {object} payload - ข้อมูลวิดีโอและสินค้า
 * @returns {Promise<object>} ผลลัพธ์
 */
export async function postToTikTok(payload) {
  const response = await chrome.runtime.sendMessage({ type: "POST_TO_TIKTOK", payload });
  if (!response?.ok) throw new Error(response?.error || "โพสต์ลง TikTok ไม่สำเร็จ");
  return response;
}
