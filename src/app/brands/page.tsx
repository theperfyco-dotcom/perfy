import Link from 'next/link'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getAllBrands } from '@/lib/db'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Fragrance Brands',
  description: 'Browse all fragrance brands on Perfy — from niche houses to designer classics.',
}

export default async function BrandsPage() {
  const brands = await getAllBrands()

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>
              Explore <em>Brands</em>
            </h1>
            <p className={styles.sub}>
              {brands.length.toLocaleString()} fragrance houses
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.grid}>
            {brands.map(brand => (
              <div key={brand.id} className={styles.card}>
                <Link href={`/brand/${brand.slug}`} className={styles.cardLink}>
                  <p className={styles.brandName}>{brand.name}</p>
                  {brand.country && (
                    <p className={styles.country}>{brand.country}</p>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
