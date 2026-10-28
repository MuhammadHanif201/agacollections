// clientside/zayqora/policies.blade.php
import { connectDb } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { buildMetadata } from '@/lib/seo';
import { PageStyles } from '@/components/store/LegacyStyles';
import PoliciesTabs from '@/components/store/PoliciesTabs';
import ZqHero from '@/components/store/ZqHero';
import { Policy } from '@/models/content';
import StoreLink from '@/components/store/StoreLink';

export async function generateMetadata() {
  return buildMetadata({ page: 'policies' });
}

export default async function PoliciesPage() {
  await connectDb();
  const policies = await Policy.find({ status: 'published' }).sort({ _id: 1 }).lean();

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__policies.1', 'clientside__zayqora__partials__zq-hero.1']} />

      <ZqHero
        image={mediaUrl('banners/zq-jeans.jpg')}
        imageMobile={mediaUrl('banners/zq-jeans-m.jpg')}
        crumbs={[{ label: 'Home', url: '/' }, { label: 'Policies' }]}
        eyebrow="AGA Collections"
        title="Our Policies"
        subtitle="Shipping, returns, payment and privacy, in one place."
      />

      <div className="policies-wrap">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 d-none d-lg-block">
              <div className="policies-sidebar">
                <span className="policies-sidebar-title">Quick Links</span>
                <ul className="policies-sidebar-list">
                  {policies.map((p, i) => (
                    <li key={p._id}>
                      <StoreLink href="#" className={`sidebar-link ${i === 0 ? 'active' : ''}`} data-key={p.key}>
                        {p.title_en}
                      </StoreLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-lg-9">
              <nav className="policies-tab-nav">
                {policies.map((p, i) => (
                  <button className={`policies-tab-btn ${i === 0 ? 'active' : ''}`} data-key={p.key} key={p._id}>
                    {p.title_en}
                  </button>
                ))}
              </nav>

              {policies.map((p, i) => (
                <div className={`policy-panel ${i === 0 ? 'active' : ''}`} id={`panel-${p.key}`} key={p._id}>
                  <div className="policy-card" dangerouslySetInnerHTML={{ __html: p.content_en ?? '' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PoliciesTabs />
    </>
  );
}
