import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Announcement } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import {
  Megaphone,
  MessageSquare,
  HelpCircle,
  Bell,
  Calendar,
  Send,
  Plus,
} from 'lucide-react';

export const CommunicationModule: React.FC = () => {
  const {
    t,
    language,
    announcements,
    activeSubModule,
    setActiveSubModule,
    currentUser,
  } = useApp();

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'HR Administration',
      text: 'Reminder: All staff must submit medical certificates for any sick leave exceeding 2 consecutive days.',
      time: 'Yesterday 14:00',
      isMe: false,
    },
    {
      id: 'm-2',
      sender: currentUser.fullName,
      text: 'Noted with thanks. Is the flu vaccination clinic scheduled for next Wednesday?',
      time: 'Yesterday 15:30',
      isMe: true,
    },
  ]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        sender: currentUser.fullName,
        text: messageText,
        time: 'Just now',
        isMe: true,
      },
    ]);
    setMessageText('');
    alerts.success(language === 'lo' ? 'ສົ່ງຂໍ້ຄວາມສຳເລັດ' : 'Message Sent to HR');
  };

  const faqs = [
    {
      qLao: 'ການຄິດໄລ່ເງິນເດືອນ ແລະ ປະກັນສັງຄົມ (LSSO) ຂອງ LHSE ເປັນແນວໃດ?',
      qEn: 'How are salary and social security (LSSO) calculated at LHSE?',
      aLao: 'LHSE ປະຕິບັດຕາມກົດໝາຍປະກັນສັງຄົມ ແຫ່ງ ສປປ ລາວ ຢ່າງເຂັ້ມງວດ ໂດຍຫັກ 5.5% ຂອງເງິນເດືອນພື້ນຖານ (ສູງສຸດບໍ່ເກີນ 247,500 ກີບ ຕາມເພດານ 4,500,000 ກີບ) ແລະ ອົງກອນສົມທົບ 6.0%. ລະບົບບໍ່ມີການຄິດໄລ່ຄ່າລ່ວງເວລາ (ໂອທີ).',
      aEn: 'LHSE strictly complies with Lao Social Security Law: 5.5% employee deduction up to the 4.5M LAK ceiling (max 247,500 LAK) with 6.0% employer contribution. No overtime is implemented.',
    },
    {
      qLao: 'ຂັ້ນຕອນການຍື່ນຂໍລາພັກປະຈຳປີ ຕ້ອງເຮັດແນວໃດ?',
      qEn: 'What is the procedure for Annual Leave requests?',
      aLao: 'ພະນັກງານສາມາດຍື່ນຄຳຮ້ອງຜ່ານໂມດູນ "ການຄຸ້ມຄອງການລາພັກ". ຄຳຮ້ອງຈະຖືກສົ່ງຕໍ່ຫາຫົວໜ້າພະແນກ (Step 1) ແລະ ຫົວໜ້າ HR (Step 2) ອັດຕະໂນມັດ.',
      aEn: 'Employees submit via the Leave Management module. The request automatically routes sequentially to their direct supervisor (Step 1) and HR Manager (Step 2).',
    },
    {
      qLao: 'ນະໂຍບາຍປະກັນໄພສຸຂະພາບ ພະນັກງານ LHSE ກວມເອົາຫຍັງແດ່?',
      qEn: 'What does the LHSE employee healthcare plan cover?',
      aLao: 'ກວມເອົາຄ່າປິ່ນປົວສຸຂະພາບທັງຜູ້ປ່ວຍນອກ (OPD) ແລະ ຜູ້ປ່ວຍໃນ (IPD) ຢູ່ບັນດາໂຮງໝໍຄູ່ສັນຍາ ລວມທັງໂຮງໝໍສາກົນ ໃນນະຄອນຫຼວງວຽງຈັນ ແລະ ຕ່າງປະເທດ.',
      aEn: 'Comprehensive outpatient (OPD) and inpatient (IPD) medical treatment at contracted state and private hospitals in Vientiane Capital and regional centers.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubModule('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'announcements'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>{t('announcements')}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('messages')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'messages'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('hrMessaging')}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('faq')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'faq'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('faq')}</span>
        </button>
      </div>

      {activeSubModule === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-3xl border transition-all ${
                ann.isImportant
                  ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              } shadow-xs space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {ann.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(ann.publishedAt).toLocaleDateString()} • {ann.publishedBy}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {language === 'lo' ? ann.titleLao : ann.titleEn}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'lo' ? ann.contentLao : ann.contentEn}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeSubModule === 'messages' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[520px] overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ຕິດຕໍ່ສອບຖາມ ພະແນກບຸກຄະລາກອນ (HR Helpdesk)' : 'Direct HR Inquiry Channel'}
              </h4>
              <p className="text-[11px] text-slate-500">Official enterprise ticket & support correspondence</p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-slate-400 mb-0.5">{m.sender} • {m.time}</div>
                <div
                  className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${
                    m.isMe
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={language === 'lo' ? 'ພິມຂໍ້ຄວາມສອບຖາມຫາ HR...' : 'Type inquiry to HR Department...'}
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden"
            />
            <button
              onClick={handleSendMessage}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeSubModule === 'faq' && (
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
            >
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>{language === 'lo' ? f.qLao : f.qEn}</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
                {language === 'lo' ? f.aLao : f.aEn}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
