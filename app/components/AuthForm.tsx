'use client';

import { CheckCircle, Eye, EyeOff, Github, Loader2, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
  onSuccess: (sessionData?: { user: { id: string; email: string; name: string } }) => void;
  onSignIn: (email: string, password: string) => Promise<{ id: string; email: string; name: string }>;
  onSignUp: (email: string, password: string, name: string) => Promise<{ id: string; email: string; name: string } | null>;
  onOAuthLogin: () => Promise<void>;
}

export function AuthForm({
  mode,
  onModeChange,
  onSuccess,
  onSignIn,
  onSignUp,
  onOAuthLogin,
}: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const isSignIn = mode === 'signin';

  function updateField<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function isFormValid() {
    if (isSignIn) {
      return Boolean(formData.email && formData.password);
    }

    return Boolean(
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.name &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 6
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isSignIn) {
        const user = await onSignIn(formData.email, formData.password);
        setSuccessMessage('登录成功！');
        onSuccess({ user });
      } else {
        const user = await onSignUp(formData.email, formData.password, formData.name);
        if (user) {
          setSuccessMessage('注册成功！正在进入应用...');
          onSuccess({ user });
        } else {
          setSuccessMessage('注册成功！如果启用了邮箱验证，请先查收邮件。');
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuthLogin() {
    setError('');
    setOAuthLoading(true);
    try {
      await onOAuthLogin();
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : 'GitHub 登录失败');
      setOAuthLoading(false);
    }
  }

  return (
    <div className="login-card glass-panel">
      <div className="login-head">
        <h1 className="login-title">AI Chat</h1>
        <p className="login-subtitle">{isSignIn ? '欢迎回来！请登录您的账户' : '创建账户开始使用'}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {!isSignIn ? (
          <label className="auth-field">
            <span className="auth-label">用户名</span>
            <span className="auth-input-wrap">
              <User className="auth-icon" />
              <input
                type="text"
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="请输入用户名"
                required
              />
            </span>
          </label>
        ) : null}

        <label className="auth-field">
          <span className="auth-label">邮箱地址</span>
          <span className="auth-input-wrap">
            <Mail className="auth-icon" />
            <input
              type="email"
              value={formData.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="请输入邮箱"
              required
            />
          </span>
        </label>

        <label className="auth-field">
          <span className="auth-label">密码</span>
          <span className="auth-input-wrap">
            <Lock className="auth-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder={isSignIn ? '请输入密码' : '至少6位字符'}
              required
              minLength={6}
            />
            <button
              className="auth-visibility"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff className="auth-icon-small" /> : <Eye className="auth-icon-small" />}
            </button>
          </span>
        </label>

        {!isSignIn ? (
          <label className="auth-field">
            <span className="auth-label">确认密码</span>
            <span className="auth-input-wrap">
              <Lock className="auth-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder="请再次输入密码"
                required
              />
            </span>
            {formData.confirmPassword && formData.password !== formData.confirmPassword ? (
              <span className="auth-helper auth-helper-error">两次输入的密码不一致</span>
            ) : null}
          </label>
        ) : null}

        {error ? <div className="auth-alert auth-alert-error">{error}</div> : null}
        {successMessage ? (
          <div className="auth-alert auth-alert-success">
            <CheckCircle className="auth-icon-small" />
            <span>{successMessage}</span>
          </div>
        ) : null}

        <button className="auth-submit" type="submit" disabled={!isFormValid() || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="auth-spinner" />
              <span>{isSignIn ? '登录中...' : '注册中...'}</span>
            </>
          ) : (
            <span>{isSignIn ? '登录' : '注册'}</span>
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>或使用以下方式登录</span>
      </div>

      <button className="auth-oauth-button" type="button" disabled={oauthLoading} onClick={() => void handleOAuthLogin()}>
        {oauthLoading ? <Loader2 className="auth-spinner" /> : <Github className="auth-icon-small" />}
        <span>GitHub</span>
      </button>

      <div className="auth-switch">
        {isSignIn ? (
          <>
            还没有账户？
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccessMessage('');
                onModeChange('signup');
              }}
            >
              立即注册
            </button>
          </>
        ) : (
          <>
            已经有账户？
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccessMessage('');
                onModeChange('signin');
              }}
            >
              返回登录
            </button>
          </>
        )}
      </div>

      <p className="login-footnote">登录即表示您同意我们的服务条款和隐私政策</p>
    </div>
  );
}
