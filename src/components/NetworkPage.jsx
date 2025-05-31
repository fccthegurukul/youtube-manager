import React from 'react';
import './NetworkPage.css';
import { FaYoutube, FaInstagram, FaFacebook, FaExternalLinkAlt, FaWhatsapp } from 'react-icons/fa';

import bseb10thLogo from '../assets/bseb_10th_logo.jpg';
import bseb10thNewsLogo from '../assets/bseb_10th_news_logo.jpg';
import bsebHindiEnglishLogo from '../assets/bseb_hindi_english_logo.jpg';
import currentaffairs from '../assets/currentaffairs_logo.jpg';
import fccInstagramLogo from '../assets/fcc_instagram_logo.jpg';
import fccTheGurukulLogo from '../assets/fccthegurukul_logo.png';
import resultBuzzLogo from '../assets/ResultBuzz-Logo.png';

const socialLinks = [
  {
    name: 'FCC The Gurukul',
    platform: 'YouTube',
    logo: fccTheGurukulLogo,
    url: 'https://www.youtube.com/@off.fccthegurukul',
    followers: '6 Subscribers',
    platformIcon: <FaYoutube className="platform-icon youtube" />,
    iconClass: 'youtube',
  },
  {
    name: 'Bihar Board 10th FCC',
    platform: 'YouTube',
    logo: bseb10thLogo,
    url: 'https://www.youtube.com/@BiharBoard10thFCC',
    followers: '6 Subscribers',
    platformIcon: <FaYoutube className="platform-icon youtube" />,
    iconClass: 'youtube',
  },
  {
    name: 'Bihar Board News & Tips FCC',
    platform: 'YouTube',
    logo: bseb10thNewsLogo,
    url: 'https://www.youtube.com/@BiharBoardNewsTipsFCC',
    followers: '2 Subscribers',
    platformIcon: <FaYoutube className="platform-icon youtube" />,
    iconClass: 'youtube',
  },
  {
    name: 'Bihar Board Hindi & English FCC',
    platform: 'YouTube',
    logo: bsebHindiEnglishLogo,
    url: 'https://www.youtube.com/@BiharBoardHindiEnglishFCC',
    followers: '2 Subscribers',
    platformIcon: <FaYoutube className="platform-icon youtube" />,
    iconClass: 'youtube',
  },
  {
    name: 'FCC The Gurukul',
    platform: 'Instagram',
    logo: fccInstagramLogo,
    url: 'https://www.instagram.com/fccthegurukul.new/',
    followers: '2 Followers',
    platformIcon: <FaInstagram className="platform-icon instagram" />,
    iconClass: 'instagram',
  },
  {
    name: 'Current Affairs FCC',
    platform: 'Instagram',
    logo: currentaffairs,
    url: 'https://www.instagram.com/currentaffairs.fcc/',
    followers: '14K+ Followers',
    platformIcon: <FaInstagram className="platform-icon instagram" />,
    iconClass: 'instagram',
  },
  {
    name: 'FCC The Gurukul',
    platform: 'Facebook',
    logo: fccTheGurukulLogo,
    url: 'https://www.facebook.com/fccthegurukul.new/',
    followers: '2 Likes / 2 Followers',
    platformIcon: <FaFacebook className="platform-icon facebook" />,
    iconClass: 'facebook',
  },
  {
    name: 'Bihar Board 10th',
    platform: 'WhatsApp',
    logo: bseb10thLogo,
    url: 'https://whatsapp.com/channel/0029VbAmnfMBKfi9F1UHDn3q',
    followers: 'Join Channel',
    platformIcon: <FaWhatsapp className="platform-icon whatsapp" />,
    iconClass: 'whatsapp',
  },
  {
    name: 'Hindi & English',
    platform: 'WhatsApp',
    logo: bsebHindiEnglishLogo,
    url: 'https://whatsapp.com/channel/0029VbAjTmY2f3EMc3cD8w1T',
    followers: 'Join Channel',
    platformIcon: <FaWhatsapp className="platform-icon whatsapp" />,
    iconClass: 'whatsapp',
  },
  {
    name: 'Current Affairs Daily',
    platform: 'WhatsApp',
    logo: currentaffairs,
    url: 'https://whatsapp.com/channel/0029VbAfK4r0wajvGpkYi112',
    followers: 'Join Channel',
    platformIcon: <FaWhatsapp className="platform-icon whatsapp" />,
    iconClass: 'whatsapp',
  },
  {
    name: 'Result Buzz',
    platform: 'WhatsApp',
    logo: resultBuzzLogo,
    url: 'https://whatsapp.com/channel/0029VbAzIp90rGiGJmT5SF3q',
    followers: 'Join Channel',
    platformIcon: <FaWhatsapp className="platform-icon whatsapp" />,
    iconClass: 'whatsapp',
  },
  {
    name: 'FCC The Gurukul Website',
    platform: 'WhatsApp',
    logo: fccTheGurukulLogo,
    url: 'https://whatsapp.com/channel/0029VbBHQ9LLdQefRLsjg73L',
    followers: 'Join Channel',
    platformIcon: <FaWhatsapp className="platform-icon whatsapp" />,
    iconClass: 'whatsapp',
  },
  {
    name: 'Bihar Board News & Tips',
    platform: 'WhatsApp',
    logo: bseb10thNewsLogo,
    url: 'https://whatsapp.com/channel/0029VbAx8zqFXUuaiZF9Id0V',
    followers: 'Join Channel',
    platformIcon: <FaWhatsapp className="platform-icon whatsapp" />,
    iconClass: 'whatsapp',
  },
];

const NetworkPage = () => {
  return (
    <div className="network-page">
      <h1 className="title">🌐 FCC The Gurukul Network</h1>
      <p className="subtitle">Explore our interconnected online presence</p>
      <div className="cards-container">
        {socialLinks.map((item, index) => (
          <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="card">
            <div className="logo-section">
              <div className={`logo-platform-icon ${item.iconClass}`}>
                {item.platformIcon}
              </div>
              <div className="logo-container">
                <img src={item.logo} alt={`${item.name} logo`} className="card-logo" />
              </div>
            </div>
            <div className="card-info">
              <h2 className="card-name">{item.name}</h2>
              <span className="followers-count">{item.followers}</span>
              <div className="link-cue">
                <FaExternalLinkAlt className="external-link-icon" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NetworkPage;
