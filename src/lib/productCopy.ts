// Product descriptions written for search and AI (Google, Bing, ChatGPT), shown in place of the saved ones (by slug).
// The first <p> is the short line beside the price and the Google description (keep it under ~158 characters);
// the rest fills the "Product details" card. Facts only: what the product page and photos show.
// To go back to the description saved in the admin panel, remove the product's entry.
const plainHoodie = (colour: string, colourLine: string, styling: string) => `
<p>Plain ${colour.toLowerCase()} 450 GSM heavyweight hoodie with an oversized unisex fit. Thick, soft and warm for winter. Cash on delivery across Pakistan.</p>
<p>Most hoodies feel thin after a few washes. This one is cut from <strong>450 GSM heavyweight fleece</strong>, so it feels solid in your hands, keeps its shape and keeps you warm when the weather turns cold. ${colourLine} ${styling}</p>
<ul>
  <li><strong>Fabric:</strong> 450 GSM heavyweight fleece, soft on the inside</li>
  <li><strong>Fit:</strong> oversized and unisex, with dropped shoulders and a relaxed body</li>
  <li><strong>Details:</strong> hood, front kangaroo pocket, ribbed cuffs and hem</li>
  <li><strong>Colour:</strong> ${colour}, plain with no logos or prints</li>
  <li><strong>Sizes:</strong> XS, S, M, L, XL</li>
</ul>
<p><strong>Choosing your size:</strong> the cut is already oversized, so your usual size gives a relaxed fit and one size up gives an extra-baggy look. Between two sizes, choose the larger one. Not sure? Send us your height and usual size on WhatsApp and we will help you pick.</p>
<p><strong>Care:</strong> wash cold and inside out with similar colours, avoid high-heat tumble drying, and iron on low if needed.</p>`;

export const PRODUCT_COPY: Record<string, string> = {
  '450-gsm-essential-oversized-hoodie-black': plainHoodie(
    'Black',
    'A clean, plain black that never looks out of place.',
    'Wear it with baggy jeans, cargos or joggers and white sneakers for an easy everyday streetwear look.',
  ),
  '450-gsm-essential-oversized-hoodie-dusty-lavender': plainHoodie(
    'Dusty Lavender',
    'Dusty lavender is a soft, muted purple that stands out without being loud.',
    'It looks best with black, grey or light blue baggy jeans and clean white sneakers.',
  ),
};
