// Port of resources/views/adminside/Layouts/footer.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, session, date, optional, addslashes } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let {  } = d;

  return {
    title: html``,
    styles: html``,
    content: html`<footer class="main-footer">
    <style>
        .main-footer {
            background: #ffffff !important;
            border-top: 1px solid #EAEAEE !important;
            padding: .7rem 1.5rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-wrap: wrap !important;
            gap: .5rem !important;
            font-size: .78rem !important;
            color: #9090A8 !important;
            font-family: 'Manrope', sans-serif !important;
        }
        .footer-brand { display: flex; align-items: center; gap: .4rem; }
        .footer-brand a {
            color: #111111;
            text-decoration: none;
            font-weight: 600;
            transition: color .15s;
        }
        .footer-brand a:hover { color: #2A2A2A; }
        .footer-sep { color: #D4D4D4; margin: 0 .3rem; }
        .footer-right { color: #A3A3A3; font-size: .75rem; }
    </style>

    <div class="footer-brand">
        <span>Powered by <a href="#" target="_blank" rel="noopener">BB</a></span>
        <span class="footer-sep">&middot;</span>
        <span>
            &copy; ${date('Y')}
            <a href="${route('admin.home')}">${optional(companySetting)?.company_name ?? 'AGA Collections'}</a>
        </span>
    </div>
    <div class="footer-right">All rights reserved.</div>
</footer>
</div>

<!-- jQuery -->
<script src="${asset('adminSide/plugins/jquery/jquery.min.js')}"></script>
<!-- Bootstrap -->
<script src="${asset('adminSide/plugins/bootstrap/5.1.3/js/bootstrap.bundle.min.js')}"></script>
<!-- Font Awesome -->
<script src="${asset('adminSide/plugins/font-awesome/6.5.2/js/all.min.js')}"></script>
<!-- AdminLTE -->
<script src="${asset('adminSide/dist/js/adminlte.min.js')}"></script>
<!-- Validation -->
<script src="${asset('adminSide/plugins/jquery-validation/jquery.validate.min.js')}"></script>
<script src="${asset('adminSide/plugins/jquery-validation/additional-methods.min.js')}"></script>
<!-- SweetAlert2 -->
<script src="${asset('adminSide/plugins/sweetalert2/sweetalert2.min.js')}"></script>
<!-- Toastr -->
<script src="${asset('adminSide/plugins/toastr/toastr.min.js')}"></script>
<!-- jQuery UI -->
<script src="${asset('adminSide/plugins/jquery-ui/jquery-ui.min.js')}"></script>
<!-- Datepicker -->
<script src="${asset('adminSide/plugins/bootstrap-datepicker/bootstrap-datepicker.min.js')}"></script>
<!-- Sortable -->
<script src="${asset('adminSide/plugins/sortablejs/Sortable.min.js')}"></script>
<!-- Quill -->
<script src="${asset('adminSide/plugins/quill/2.0.2/quill.min.js')}"></script>
<!-- Tagify -->
<script src="${asset('adminSide/plugins/tagify/3.14.1/tagify.min.js')}"></script>

<script>
document.addEventListener('DOMContentLoaded', function () {
    ${(session('success')) ? html`        Swal.fire({
            icon: 'success',
            title: '${addslashes(session('success'))}',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            position: 'top-end',
            customClass: { popup: 'rounded-3 shadow' }
        });
    ` : ''}
    ${(session('error')) ? html`        Swal.fire({
            icon: 'error',
            title: '${addslashes(session('error'))}',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            position: 'top-end',
            customClass: { popup: 'rounded-3 shadow' }
        });
    ` : ''}});
</script>

${d.scripts}`,
    scripts: html``,
  };
}
