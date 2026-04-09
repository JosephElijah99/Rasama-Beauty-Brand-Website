/* ── RASAMA Beauty – Shared JS ── */

const PRODUCTS=[
  {id:1,name:"Rosehip Glow Serum",cat:"Serum",desc:"Brightens & evens skin tone with pure rosehip oil",price:8500,emoji:"🌹",badge:"Bestseller",stock:24},
  {id:2,name:"Shea Butter Night Cream",cat:"Moisturizer",desc:"Deep overnight nourishment with raw African shea butter",price:6800,emoji:"🫧",badge:"",stock:18},
  {id:3,name:"Turmeric Radiance Oil",cat:"Serum",desc:"Fades dark spots with golden turmeric & neroli extract",price:9500,emoji:"✨",badge:"New",isNew:true,stock:12},
  {id:4,name:"Aloe Vera Gentle Cleanser",cat:"Cleanser",desc:"Soothing daily cleanser for all skin types",price:4500,emoji:"🌱",badge:"",stock:30},
  {id:5,name:"Green Tea Balancing Toner",cat:"Cleanser",desc:"Minimises pores & controls oil production naturally",price:5200,emoji:"🍃",badge:"",stock:22},
  {id:6,name:"SPF 50 Glow Sunscreen",cat:"Sunscreen",desc:"Lightweight UV protection with vitamin C boost",price:7200,emoji:"☀️",badge:"Bestseller",stock:15},
  {id:7,name:"Baobab Body Butter",cat:"Body",desc:"Rich head-to-toe moisture from baobab fruit oil",price:5800,emoji:"🌴",badge:"",stock:20},
  {id:8,name:"Kaolin Clay Face Mask",cat:"Mask",desc:"Deep cleanse & detox with Moroccan kaolin clay",price:5500,emoji:"🏺",badge:"New",isNew:true,stock:9},
];

/* ── SETTINGS (loaded from localStorage if saved) ── */
let CFG = JSON.parse(localStorage.getItem('rasama_cfg') || 'null') || {
  pk:'pk_test_demo_rasama_beauty_2024',
  wa:'+2348000000001',
  email:'admin@rasamabeauty.com',
  name:'RASAMA Beauty Natural Skincare'
};

/* ── CART (persisted in sessionStorage) ── */
let cart = JSON.parse(sessionStorage.getItem('rasama_cart') || '[]');
let orders = JSON.parse(sessionStorage.getItem('rasama_orders') || '[]');
let emailLog = JSON.parse(sessionStorage.getItem('rasama_emails') || '[]');
let orderIdCounter = parseInt(sessionStorage.getItem('rasama_oid') || '1000');

function saveCart(){ sessionStorage.setItem('rasama_cart', JSON.stringify(cart)); }
function saveOrders(){ sessionStorage.setItem('rasama_orders', JSON.stringify(orders)); sessionStorage.setItem('rasama_emails', JSON.stringify(emailLog)); sessionStorage.setItem('rasama_oid', orderIdCounter); }

/* ── NAV HIGHLIGHT ── */
function setActiveNav(){
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nl').forEach(a=>{
    if(a.getAttribute('href') === page) a.classList.add('active');
  });
}

/* ── MOBILE MENU ── */
function toggleMob(){ document.getElementById('navLinks').classList.toggle('mob-open'); }

/* ── CART FUNCTIONS ── */
function addToCart(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p||p.stock===0) return;
  const ex = cart.find(x=>x.id===id);
  if(ex){ if(ex.qty < p.stock) ex.qty++; else{ showToast('Max stock reached'); return; } }
  else cart.push({id:p.id,name:p.name,price:p.price,emoji:p.emoji,qty:1});
  saveCart(); updateCartUI(); showToast(p.name+' added ✓');
}
function removeFromCart(id){ cart=cart.filter(x=>x.id!==id); saveCart(); updateCartUI(); }
function changeQty(id,d){
  const item=cart.find(x=>x.id===id); if(!item) return;
  item.qty+=d; if(item.qty<1) removeFromCart(id); else{ saveCart(); updateCartUI(); }
}
function cartTotal(){ return cart.reduce((s,x)=>s+x.price*x.qty,0); }

function updateCartUI(){
  const count=cart.reduce((s,x)=>s+x.qty,0);
  const cc=document.getElementById('cartCount'); if(cc) cc.textContent=count;
  const el=document.getElementById('cartItemsEl'), foot=document.getElementById('cartFootEl');
  if(!el) return;
  if(!cart.length){
    el.innerHTML='<div class="cart-empty">Your cart is empty.<br>Add a product to begin.</div>';
    if(foot) foot.style.display='none'; return;
  }
  el.innerHTML=cart.map(x=>`
    <div class="ci">
      <div class="ci-emoji">${x.emoji}</div>
      <div class="ci-info">
        <div class="ci-name">${x.name}</div>
        <div class="ci-price">₦${(x.price*x.qty).toLocaleString()}</div>
        <div class="ci-qty">
          <button class="qb" onclick="changeQty(${x.id},-1)">−</button>
          <span class="qv">${x.qty}</span>
          <button class="qb" onclick="changeQty(${x.id},1)">+</button>
        </div>
      </div>
      <button class="ci-rm" onclick="removeFromCart(${x.id})">✕</button>
    </div>`).join('');
  if(foot){ foot.style.display='block'; document.getElementById('cartTotalEl').textContent='₦'+cartTotal().toLocaleString(); }
}

function toggleCart(){ document.getElementById('cartDrawer').classList.toggle('open'); }

/* ── CHECKOUT ── */
function openCheckout(){
  document.getElementById('cartDrawer').classList.remove('open');
  const sumEl=document.getElementById('orderSumEl');
  if(sumEl) sumEl.innerHTML=`<div class="os-title">Order Summary</div>`+
    cart.map(x=>`<div class="os-line"><span>${x.name} × ${x.qty}</span><span>₦${(x.price*x.qty).toLocaleString()}</span></div>`).join('')+
    `<div class="os-total"><span>Total</span><span>₦${cartTotal().toLocaleString()}</span></div>`;
  const fa=document.getElementById('checkoutFormArea'); if(fa) fa.style.display='block';
  const sv=document.getElementById('successView'); if(sv) sv.classList.remove('show');
  document.getElementById('checkoutModal').classList.add('open');
}
function closeCheckout(){ document.getElementById('checkoutModal').classList.remove('open'); }

function initiatePaystack(){
  const fn=document.getElementById('f-fname').value.trim();
  const ln=document.getElementById('f-lname').value.trim();
  const em=document.getElementById('f-email').value.trim();
  const ph=document.getElementById('f-phone').value.trim();
  const ad=document.getElementById('f-address').value.trim();
  const ci=document.getElementById('f-city').value.trim();
  const st=document.getElementById('f-state').value;
  if(!fn||!ln||!em||!ph){ showToast('Please fill all required fields'); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){ showToast('Please enter a valid email'); return; }
  const total=cartTotal();
  if(CFG.pk.includes('demo')){
    showToast('Processing payment...');
    setTimeout(()=>onPaySuccess(fn,ln,em,ph,ad,ci,st,total,'RASAMA-DEMO-'+Date.now()),1800);
    return;
  }
  const h=PaystackPop.setup({
    key:CFG.pk, email:em, amount:total*100, currency:'NGN',
    ref:'RASAMA-'+Date.now(),
    callback:r=>onPaySuccess(fn,ln,em,ph,ad,ci,st,total,r.reference),
    onClose:()=>showToast('Payment cancelled')
  });
  h.openIframe();
}

function onPaySuccess(fn,ln,em,ph,ad,ci,st,total,ref){
  const oid='#RB-'+(++orderIdCounter);
  const now=new Date();
  const ds=now.toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'});
  const ts=now.toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'});
  const order={id:oid,ref,fname:fn,lname:ln,email:em,phone:ph,
    address:ad+(ci?', '+ci:'')+(st?', '+st:''),
    items:cart.map(x=>({...x})),total,date:ds,time:ts,status:'Paid'};
  orders.unshift(order);
  emailLog.unshift(
    {to:em,subject:`Order Confirmed – ${oid} | ${CFG.name}`,time:ts,type:'customer'},
    {to:CFG.email,subject:`New Order ${oid} – ₦${total.toLocaleString()} from ${fn} ${ln}`,time:ts,type:'owner'}
  );
  saveOrders();
  const cep=document.getElementById('custEmailPreview');
  const oep=document.getElementById('ownerEmailPreview');
  if(cep) cep.innerHTML=`To: <strong>${em}</strong><br>Subject: Order Confirmed – ${oid}`;
  if(oep) oep.innerHTML=`To: <strong>${CFG.email}</strong><br>Subject: New Order ${oid}`;
  const fa=document.getElementById('checkoutFormArea'); if(fa) fa.style.display='none';
  const sv=document.getElementById('successView'); if(sv) sv.classList.add('show');
  cart=[]; saveCart(); updateCartUI();
}

function resetAfterOrder(){
  const sv=document.getElementById('successView'); if(sv) sv.classList.remove('show');
  const fa=document.getElementById('checkoutFormArea'); if(fa) fa.style.display='block';
  ['f-fname','f-lname','f-email','f-phone','f-address','f-city'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const fs=document.getElementById('f-state'); if(fs) fs.value='';
}

/* ── WHATSAPP ── */
let waOpen=false;
function getWaNum(){ return CFG.wa.replace(/\D/g,''); }
function openWhatsApp(msg){ window.open(`https://wa.me/${getWaNum()}?text=${encodeURIComponent(msg)}`,'_blank'); }
function toggleWa(){ waOpen=!waOpen; document.getElementById('waPopup').classList.toggle('open',waOpen); document.getElementById('waNotif').style.display=waOpen?'none':'flex'; }
function closeWa(){ waOpen=false; document.getElementById('waPopup').classList.remove('open'); }

/* ── TOAST ── */
function showToast(msg){
  const t=document.getElementById('toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2600);
}

/* ── SHARED CART + MODAL HTML injected into every page ── */
function injectCartAndModal(){
  const states=['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
  document.body.insertAdjacentHTML('beforeend',`
  <!-- CART DRAWER -->
  <div class="cart-drawer" id="cartDrawer">
    <div class="drawer-head"><h3>Your Cart</h3><button class="close-x" onclick="toggleCart()">✕</button></div>
    <div class="cart-items" id="cartItemsEl"></div>
    <div class="cart-foot" id="cartFootEl" style="display:none">
      <div class="cart-total-row"><span>Total</span><span id="cartTotalEl">₦0</span></div>
      <button class="checkout-btn" onclick="openCheckout()">Proceed to Checkout</button>
      <p class="secure-note">🔒 Secured by Paystack · Cards · Bank Transfer · USSD</p>
    </div>
  </div>
  <!-- CHECKOUT MODAL -->
  <div class="modal-bg" id="checkoutModal">
    <div class="modal">
      <div class="modal-head"><h3>Checkout</h3><button class="close-x" onclick="closeCheckout()">✕</button></div>
      <div id="checkoutFormArea">
        <div class="modal-body">
          <div class="order-sum" id="orderSumEl"></div>
          <div class="form-row2">
            <div><label class="form-lbl">First Name *</label><input class="form-inp" id="f-fname" placeholder="Amara"></div>
            <div><label class="form-lbl">Last Name *</label><input class="form-inp" id="f-lname" placeholder="Okafor"></div>
          </div>
          <label class="form-lbl">Email *</label><input class="form-inp" id="f-email" type="email" placeholder="you@example.com">
          <label class="form-lbl">Phone *</label><input class="form-inp" id="f-phone" type="tel" placeholder="+234 800 000 0000">
          <label class="form-lbl">Delivery Address</label><input class="form-inp" id="f-address" placeholder="House no., Street, Area">
          <div class="form-row2">
            <div><label class="form-lbl">City</label><input class="form-inp" id="f-city" placeholder="Kano"></div>
            <div><label class="form-lbl">State</label>
              <select class="form-inp" id="f-state"><option value="">Select State</option>${states.map(s=>`<option>${s}</option>`).join('')}</select>
            </div>
          </div>
          <button class="pay-btn" onclick="initiatePaystack()">Pay with Paystack</button>
          <p class="pay-note">🔒 100% Secure · Powered by Paystack</p>
        </div>
      </div>
      <div class="success-view" id="successView">
        <div class="suc-icon">✅</div>
        <h2>Order Confirmed!</h2>
        <p>Thank you for shopping with <strong>RASAMA Beauty</strong>.</p>
        <div class="email-box"><div class="eb-label">📧 Customer Email Sent</div><p id="custEmailPreview"></p></div>
        <div class="email-box"><div class="eb-label">📧 Store Owner Alert Sent</div><p id="ownerEmailPreview"></p></div>
        <p style="font-size:11px;color:var(--tmu);margin-top:1rem">Delivery within 2–5 business days.</p>
        <button class="btn-gold" style="margin-top:1.5rem" onclick="closeCheckout();resetAfterOrder()">Continue Shopping</button>
      </div>
    </div>
  </div>
  <!-- WHATSAPP WIDGET -->
  <div class="wa-widget" id="waWidget">
    <div class="wa-popup" id="waPopup">
      <button class="wa-close-popup" onclick="closeWa()">✕</button>
      <div class="wa-popup-head">
        <div class="wa-avatar">🌿</div>
        <div><div class="wa-agent">RASAMA Beauty Support</div><div class="wa-status">● Online now</div></div>
      </div>
      <div class="wa-msg">Hi there! 👋 Welcome to <strong>RASAMA Beauty</strong>.<br><br>Have a question? Chat with us instantly on WhatsApp!</div>
      <button class="wa-start" onclick="openWhatsApp('Hello! I have a question about RASAMA Beauty products.')">
        <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.122 1.524 5.854L0 24l6.335-1.507A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.874 9.874 0 01-5.031-1.378l-.36-.214-3.732.888.917-3.636-.235-.374A9.861 9.861 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118c5.467 0 9.882 4.415 9.882 9.882 0 5.467-4.415 9.882-9.882 9.882z"/></svg>
        Start WhatsApp Chat
      </button>
    </div>
    <button class="wa-fab" onclick="toggleWa()" title="Chat on WhatsApp">
      <div class="wa-notif" id="waNotif">1</div>
      <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.122 1.524 5.854L0 24l6.335-1.507A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.874 9.874 0 01-5.031-1.378l-.36-.214-3.732.888.917-3.636-.235-.374A9.861 9.861 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118c5.467 0 9.882 4.415 9.882 9.882 0 5.467-4.415 9.882-9.882 9.882z"/></svg>
    </button>
  </div>
  <!-- TOAST -->
  <div class="toast" id="toast"></div>
  `);
  setTimeout(()=>{if(!waOpen){waOpen=true;document.getElementById('waPopup').classList.add('open');document.getElementById('waNotif').style.display='none';}},5000);
}

/* ── SHARED NAV HTML ── */
function renderNav(){
  document.body.insertAdjacentHTML('afterbegin',`
  <nav>
    <a class="nav-logo" href="index.html">RASAMA <em>Beauty</em></a>
    <div class="nav-links" id="navLinks">
      <a class="nl" href="index.html">Shop</a>
      <a class="nl" href="about.html">About Us</a>
      <a class="nl" href="blog.html">Blog</a>
      <a class="nl" href="contact.html">Contact</a>
      <a class="nl" href="faq.html">FAQs</a>
    </div>
    <div class="nav-right">
      <button class="cart-btn" onclick="toggleCart()">Cart <span class="cart-count" id="cartCount">0</span></button>
      <button class="mob-btn" onclick="toggleMob()">☰</button>
    </div>
  </nav>`);
  setActiveNav();
}

/* ── SHARED FOOTER HTML ── */
function renderFooter(){
  document.body.insertAdjacentHTML('beforeend',`
  <footer class="site-footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo-f">RASAMA <em>Beauty</em></div>
        <p>Luxurious botanicals crafted for African skin. 100% natural ingredients, ethically sourced, lovingly made in Nigeria.</p>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <a href="index.html">All Products</a>
        <a href="index.html">Serums & Oils</a>
        <a href="index.html">Moisturizers</a>
        <a href="index.html">Sunscreen & SPF</a>
        <a href="index.html">Body Care</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="about.html">About Us</a>
        <a href="blog.html">Blog / Journal</a>
        <a href="contact.html">Contact Us</a>
        <a href="faq.html">FAQs</a>
      </div>
      <div class="footer-col">
        <h4>Support</h4>
        <span>📞 +234 705 793 7555</span>
        <span>✉️ rasamiskincare@outlook.com</span>
        <span>📍 Abuja, Nigeria</span>
        <span>Mon–Sat · 8am–9pm</span>
        <a class="wa-footer-btn" onclick="openWhatsApp('Hello! I need help with my RASAMA Beauty order.')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.122 1.524 5.854L0 24l6.335-1.507A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.874 9.874 0 01-5.031-1.378l-.36-.214-3.732.888.917-3.636-.235-.374A9.861 9.861 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118c5.467 0 9.882 4.415 9.882 9.882 0 5.467-4.415 9.882-9.882 9.882z"/></svg>
          WhatsApp Support
        </a>
      </div>
    </div>
    <div class="footer-bottom">© 2024 <span>RASAMA Beauty Natural Skincare</span> · All rights reserved · Made with love in Nigeria</div>
  </footer>`);
}
