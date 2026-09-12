import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../lib/i18n.tsx';
import { fetchSiteSettings, DEFAULT_SITE_CONTACT_INFO } from '../lib/supabase.ts';
import type { SiteContactInfoModel } from '../types/database.ts';
import ParkLogo from './ParkLogo.tsx';

interface FooterProps {
  onNavigateToHome?: () => void;
  onNavigateToTickets?: () => void;
  onNavigateToParties?: () => void;
  onNavigateToMenu?: () => void;
  initialContactInfo?: SiteContactInfoModel;
}

export default function Footer({
  onNavigateToHome,
  onNavigateToTickets,
  onNavigateToParties,
  onNavigateToMenu,
  initialContactInfo,
}: FooterProps) {
  const { t } = useLanguage();
  const [contact, setContact] = useState<SiteContactInfoModel>(
    initialContactInfo || DEFAULT_SITE_CONTACT_INFO
  );

  useEffect(() => {
    if (initialContactInfo) {
      setContact(initialContactInfo);
      return;
    }

    let isMounted = true;
    fetchSiteSettings()
      .then((settings) => {
        if (isMounted && settings?.contact) {
          setContact(settings.contact);
        }
      })
      .catch(() => {
        // Fallback already in state
      });

    return () => {
      isMounted = false;
    };
  }, [initialContactInfo]);

  const phoneDisplay = contact.phoneSecondary
    ? `${contact.phonePrimary} / ${contact.phoneSecondary}`
    : contact.phonePrimary;

  return (
    <footer className="relative z-10 border-t border-[#EADCCF] bg-[#FFFDF9] text-[#7A6C60] text-xs">
      {/* Upper Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand & Identity */}
          <div className="md:col-span-5 space-y-4">
            <div
              onClick={onNavigateToHome}
              className="cursor-pointer group inline-block"
            >
              <ParkLogo size="lg" />
            </div>

            <p className="text-xs text-[#7A6C60] leading-relaxed max-w-sm">
              {t('footer.brand_desc')}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF1E4] border border-[#EADCCF] text-[10px] font-semibold text-[#3A2E26]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E8734A]" />
              <span>{t('footer.secure_badge')}</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#3A2E26]">
              {t('footer.navigation')}
            </h4>
            <ul className="space-y-2 text-xs">
              {onNavigateToHome && (
                <li>
                  <button
                    onClick={onNavigateToHome}
                    className="hover:text-[#E8734A] transition-colors cursor-pointer text-[#7A6C60]"
                  >
                    {t('header.home')}
                  </button>
                </li>
              )}
              {onNavigateToTickets && (
                <li>
                  <button
                    onClick={onNavigateToTickets}
                    className="hover:text-[#E8734A] transition-colors cursor-pointer text-[#7A6C60]"
                  >
                    {t('header.tickets')}
                  </button>
                </li>
              )}
              {onNavigateToParties && (
                <li>
                  <button
                    onClick={onNavigateToParties}
                    className="hover:text-[#E8734A] transition-colors cursor-pointer text-[#7A6C60]"
                  >
                    {t('header.parties')}
                  </button>
                </li>
              )}
              {onNavigateToMenu && (
                <li>
                  <button
                    onClick={onNavigateToMenu}
                    className="hover:text-[#E8734A] transition-colors cursor-pointer text-[#7A6C60]"
                  >
                    {t('header.menu')}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Contato & Localização (Editável pelo Admin) */}
          <div className="md:col-span-4 space-y-3" id="footer-contact-info-section">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#3A2E26]">
              {t('footer.contact_location')}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#7A6C60]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#E8734A] flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed" id="footer-address">
                  {contact.address}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#E8734A] flex-shrink-0" />
                <span id="footer-phone">{phoneDisplay}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#E8734A] flex-shrink-0" />
                <a
                  href={`mailto:${contact.email}`}
                  id="footer-email"
                  className="hover:text-[#E8734A] transition-colors"
                >
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div id="footer-bottom-bar" className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="footer-copyright text-[#334155] font-medium">
            © 2026 Family Fun Town. {t('footer.all_rights')}
          </div>

          <div className="footer-slogan flex items-center gap-1 text-[#0F172A] font-semibold">
            <span>{t('footer.slogan')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

