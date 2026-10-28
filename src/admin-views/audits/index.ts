// Port of resources/views/adminside/audits/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import userCell from './_userCell';
import { errors as errorBag, route, count, empty, ucfirst, array_merge, class_basename, optional, entries, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { audits, eventColors, fields } = d;

  return {
    title: html`<title>Audit Logs — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Track every admin action — who changed what, when and from where — for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="audit logs, activity log, admin actions, security log, change history, aga collections admin">
`,
    styles: html``,
    content: html`<div class="content-wrapper">

    
    <section class="content-header">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-sm-6">
                    <h1 class="fw-bold">Audit Logs</h1>
                    <small class="text-muted">Complete activity history & system changes</small>
                </div>
                <div class="col-sm-6">
                    <ol class="breadcrumb float-sm-right">
                        <li class="breadcrumb-item">
                            <a href="${route('admin.home')}">Home</a>
                        </li>
                        <li class="breadcrumb-item active">Audit Logs</li>
                    </ol>
                </div>
            </div>
        </div>
    </section>

    
    <section class="content pt-3">
        <div class="container-fluid">

            <div class="card shadow-sm">
                <div class="card-header bg-white border-bottom">
                    <h3 class="card-title fw-semibold mb-0">
                        Activity Records
                    </h3>
                </div>

                <div class="card-body table-responsive p-0">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th style="width: 22%">Actor</th>
                                <th style="width: 12%">Action</th>
                                <th style="width: 18%">Target</th>
                                <th>Changes</th>
                                <th style="width: 15%">Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${count(audits) ? foreach(audits, (audit, loop) => { let eventColors: Record<string, any> = {
                                    'created' : 'success',
                                    'updated' : 'warning',
                                    'deleted' : 'danger',
                                    };
 return html`
                            <tr>
                                
                                ${userCell({ audit }).content}
                                
                                <td>
                                                                        <span class="badge bg-${eventColors?.[audit?.event] ?? 'secondary'}">
                                        ${ucfirst(audit?.event)}
                                    </span>
                                </td>

                                
                                <td>
                                    <span class="text-muted">
                                        ${class_basename(audit?.auditable_type)}
                                    </span>
                                    <br>
                                    <small class="text-secondary">
                                        ID: ${audit?.auditable_id}
                                    </small>
                                </td>

                                
                                <td>
                                    ${(!empty(audit?.old_values) || !empty(audit?.new_values)) ? (() => { let fields = (array_merge(
                                                    audit?.old_values ?? [],
                                                    audit?.new_values ?? []
                                                    ));
 return html`                                    <button class="btn btn-sm btn-outline-primary" data-bs-toggle="collapse"
                                        data-bs-target="#audit-${audit?.id}">
                                        View changes
                                    </button>

                                    <div id="audit-${audit?.id}" class="collapse mt-2">
                                        <div class="border rounded p-2 bg-light">
                                            <table class="table table-sm table-bordered mb-0">
                                                <thead class="table-secondary">
                                                    <tr>
                                                        <th>Field</th>
                                                        <th>Old</th>
                                                        <th>New</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    
                                                    ${foreach(entries(fields), ([field, value], loop) => html`                                                    <tr>
                                                        <td class="fw-semibold">${field}</td>
                                                        <td class="text-muted">
                                                            ${audit?.old_values?.[field] ?? '—'}
                                                        </td>
                                                        <td class="fw-semibold text-success">
                                                            ${audit?.new_values?.[field] ?? '—'}
                                                        </td>
                                                    </tr>
                                                    `)}                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    `; })() : html`                                    <span class="text-muted">No field changes</span>
                                    `}                                </td>

                                
                                <td>
                                    <div class="fw-semibold">
                                        ${audit?.created_at?.timezone('Asia/Karachi')?.format('d M Y')}
                                    </div>
                                    <small class="text-muted">
                                        ${audit?.created_at?.format('h:i A')}
                                    </small>
                                </td>
                            </tr>

                            `; }) : html`                            <tr>
                                <td colspan="5" class="text-center text-muted py-4">
                                    No audit records found.
                                </td>
                            </tr>
                            `}                        </tbody>
                    </table>
                </div>

                
                <div class="card-footer bg-white border-top">
                    <div class="d-flex justify-content-center">
                        ${audits?.links('pagination::bootstrap-5')}
                    </div>
                </div>

            </div>
        </div>
    </section>
</div>
`,
    scripts: html``,
  };
}
