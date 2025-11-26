import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SettingsContext } from '../contexts/SettingsContext';
import { sendEmail } from '../services/emailService'; // Import 新的服務

export const LoginModal: React.FC = () => {
  const { login, register, setLoginModalOpen } = useContext(AuthContext);
  const { t, settings } = useContext(SettingsContext);
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState<string>('');

  useEffect(() => {
    if (isRegister) {
        setGeneratedCaptcha(Math.floor(100000 + Math.random() * 900000).toString());
        setPhone(settings.language === 'zh-TW' ? '886-' : '');
    } else {
        setRegistrationSuccess(false);
        setEmailStatus('');
    }
  }, [isRegister, settings.language]);

  const notifyRegistration = async (newUserEmail: string, newUserName: string, newUserPhone: string) => {
    if (!settings.smtpHost || !settings.smtpUser) {
        setEmailStatus('未設定 SMTP，無法發送通知信。');
        return;
    }

    // 這裡呼叫統一的 emailService
    // 邏輯：To = 註冊會員, CC = 系統管理員
    const result = await sendEmail({
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass,
        to: newUserEmail, // 寄給註冊者 (會員收不到信通常是因為這裡沒設對，或被歸類為垃圾郵件)
        cc: settings.systemEmail, // 副本給管理員
        subject: `[AI房產估價師] 歡迎加入！註冊成功通知`,
        text: `親愛的 ${newUserName} 您好，\n\n歡迎加入 AI 房產估價師！\n您的帳號已建立成功。\n\n註冊資訊：\nEmail: ${newUserEmail}\n電話: ${newUserPhone}\n\n(此信件由系統自動發送)`
    });

    if (result.success) {
        setEmailStatus('歡迎信與系統通知已發送成功。');
    } else {
        setEmailStatus(`通知信發送失敗: ${result.error}`);
    }
  };

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError(t('error_fillEmailPassword')); return; }
    
    if (isRegister) {
       if (!name.trim() || !phone.trim()) { setError(t('error_fillNamePhone')); return; }
       if (captcha !== generatedCaptcha) { 
           setError(t('captchaError')); 
           setGeneratedCaptcha(Math.floor(100000 + Math.random() * 900000).toString());
           return; 
       }

       const result = register({ email, password, name, phone });
       if (!result.success) {
         setError(t(result.messageKey));
         setGeneratedCaptcha(Math.floor(100000 + Math.random() * 900000).toString());
       } else {
           setRegistrationSuccess(true);
           setEmailStatus('正在發送通知信...');
           await notifyRegistration(email, name, phone);
       }
    } else {
      if (!login(email, password)) setError(t('loginFailed'));
    }
  };
  
  const toggleFormType = () => { setIsRegister(!isRegister); setError(''); setRegistrationSuccess(false); };
  const switchToLoginAfterSuccess = () => { setIsRegister(false); setError(''); setRegistrationSuccess(false); };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setLoginModalOpen(false)}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden border border-orange-400" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><SparklesIcon className="h-6 w-6 text-blue-600"/>{isRegister ? t('registerTitle') : t('loginTitle')}</h2>
          <button onClick={() => setLoginModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100"><XMarkIcon className="h-6 w-6" /></button>
        </header>

        <div className="p-6 space-y-4">
          {registrationSuccess ? (
              <div className="text-center space-y-6">
                  <p className="text-lg font-bold text-green-600">{t('registrationSuccess')}</p>
                  <p className="text-gray-600">{t('registrationSuccessPrompt')}</p>
                  {emailStatus && (
                      <p className={`text-xs ${emailStatus.includes('失敗') ? 'text-red-500' : 'text-gray-500'}`}>
                          {emailStatus}
                      </p>
                  )}
                  <button onClick={switchToLoginAfterSuccess} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg">{t('clickToLogin')}</button>
              </div>
          ) : (
            <form onSubmit={handleMainSubmit} className="space-y-4">
                {isRegister && <><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder={t('name')} className="w-full border p-2 rounded" required /><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder={t('phone')} className="w-full border p-2 rounded" required /></>}
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('email')} className="w-full border p-2 rounded" required />
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t('password')} className="w-full border p-2 rounded" required />
                {isRegister && <div className="flex gap-2"><input type="text" value={captcha} onChange={e=>setCaptcha(e.target.value)} placeholder={t('captcha')} className="w-full border p-2 rounded" /><div className="bg-gray-200 p-2 rounded">{generatedCaptcha}</div></div>}
                
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg">{isRegister ? t('register') : t('login')}</button>
                <p className="text-center text-sm cursor-pointer text-blue-600" onClick={toggleFormType}>{isRegister ? t('clickToLogin') : t('clickToRegister')}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};