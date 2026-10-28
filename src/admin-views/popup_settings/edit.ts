// Port of resources/views/adminside/popup_settings/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, old, csrf_field, ucfirst, max, min, optional, foreach, User } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { popup } = d;

  return {
    title: html`    <title>Popup Settings — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Configure the homepage popup banner — title, description, image, timing and visibility for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="popup settings, popup banner, promo popup, homepage popup, marketing, aga collections admin">
`,
    styles: html``,
    content: html`

<div class="content-wrapper">
    <section class="content-header">
        <div class="container-fluid d-flex justify-content-between align-items-center">
            <h1><i class="fas fa-bullhorn"></i> Popup Settings</h1>
        </div>
    </section>

    <section class="content">
        <div class="container">
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card shadow-lg">
                        <div class="card-header bg-primary text-white">
                            <h3 class="card-title"><i class="fas fa-edit"></i> Update Popup</h3>
                        </div>

                        <div class="card-body">
                            <form action="${route('admin.popup.update')}" method="POST" enctype="multipart/form-data">
                                ${csrf_field()}
                                <!-- Title -->
                                <div class="form-group">
                                    <label class="font-weight-bold">Popup Title</label>
                                    <input type="text" name="title" class="form-control" value="${old('title', popup?.title)}">
                                </div>

                                <!-- Content -->
                                <div class="form-group">
                                    <label class="font-weight-bold">Popup Content</label>
                                    <textarea name="content" class="form-control" rows="4">${old('content', popup?.content)}</textarea>
                                </div>

                                <!-- Image -->
                                <div class="form-group">
                                    <label class="font-weight-bold">Popup Image (optional)</label>
                                    <input type="file" name="image_path" class="form-control-file">
                                    ${(popup?.image_path) ? html`                                        <div class="mt-2">
                                            <img src="${asset('storage/'  +  (popup?.image_path ?? ''))}" width="150" class="img-thumbnail">
                                        </div>
                                    ` : ''}                                </div>

                                <!-- Button text + link -->
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label class="font-weight-bold">Button Text</label>
                                        <input type="text" name="button_text" class="form-control" value="${old('button_text', popup?.button_text)}">
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label class="font-weight-bold">Button Link</label>
                                        <input type="url" name="button_link" class="form-control" value="${old('button_link', popup?.button_link)}">
                                    </div>
                                </div>

                                <!-- Status & Display -->
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label class="font-weight-bold">Popup Position</label>
                                        <select name="position" class="form-control">
                                            ${foreach(['center', 'top', 'bottom', 'fullscreen'], (pos, loop) => html`                                                <option value="${pos}" ${popup?.position === pos ? 'selected' : ''}>
                                                    ${ucfirst(pos)}
                                                </option>
                                            `)}                                        </select>
                                    </div>

                                    <div class="form-group col-md-6">
                                        <label class="font-weight-bold">Delay Before Showing (seconds)</label>
                                        <input type="number" name="delay_seconds" class="form-control" value="${old('delay_seconds', popup?.delay_seconds)}" min="0" max="60">
                                    </div>
                                </div>

                                <!-- Scheduling -->
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label class="font-weight-bold">Start Date</label>
                                        <input type="datetime-local" name="start_at" class="form-control" value="${old('start_at', popup?.start_at ? popup?.start_at?.format('Y-m-d\\TH:i') : '')}">
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label class="font-weight-bold">End Date</label>
                                        <input type="datetime-local" name="end_at" class="form-control" value="${old('end_at', popup?.end_at ? popup?.end_at?.format('Y-m-d\\TH:i') : '')}">
                                    </div>
                                </div>

                                <!-- Toggles -->
                                <div class="form-group form-check">
                                    <input type="checkbox" class="form-check-input" name="is_active" id="is_active" ${popup?.is_active ? 'checked' : ''}>
                                    <label class="form-check-label" for="is_active">Enable Popup</label>
                                </div>

                                <div class="form-group form-check">
                                    <input type="checkbox" class="form-check-input" name="show_on_home" id="show_on_home" ${popup?.show_on_home ? 'checked' : ''}>
                                    <label class="form-check-label" for="show_on_home">Show on Homepage</label>
                                </div>

                                <div class="form-group form-check">
                                    <input type="checkbox" class="form-check-input" name="dismissible" id="dismissible" ${popup?.dismissible ? 'checked' : ''}>
                                    <label class="form-check-label" for="dismissible">Allow User to Dismiss</label>
                                </div>

                                <div class="form-group form-check">
                                    <input type="checkbox" class="form-check-input" name="show_once_per_user" id="show_once_per_user" ${popup?.show_once_per_user ? 'checked' : ''}>
                                    <label class="form-check-label" for="show_once_per_user">Show Only Once Per User</label>
                                </div>

                                <!-- Submit -->
                                <div class="text-center mt-4">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save"></i> Save Settings
                                    </button>
                                    <a href="${url()?.previous()}" class="btn btn-secondary">
                                        <i class="fas fa-arrow-left"></i> Back
                                    </a>
                                </div>
                            </form>
                        </div> <!-- card-body -->
                    </div> <!-- card -->
                </div> <!-- col -->
            </div>
        </div>
    </section>
</div>
`,
    scripts: html``,
  };
}
