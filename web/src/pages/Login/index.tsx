import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import { login } from '@/services/auth';

interface LoginForm {
  username: string;
  password: string;
}

function Login() {
  const navigate = useNavigate();
  const { setToken, setUser } = useUserStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginForm) => {
    try {
      const res = await login(values);
      if (res.code === 0) {
        setToken(res.data.accessToken);
        setUser(res.data.user);
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(res.message || '登录失败');
      }
    } catch {
      message.error('登录失败，请稍后重试');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card title="进销存管理系统" style={{ width: 400 }}>
        <Form form={form} onFinish={handleSubmit} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
