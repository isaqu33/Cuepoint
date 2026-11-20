<script lang="ts">
  import { Button, Container, Head, Hr, Html, Img, Preview, Section, Text } from 'svelte-email';

  export let id = '';

  const fontFamily =
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

  const main = {
    backgroundColor: '#ffffff',
  };

  const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
  };

  const paragraph = {
    fontFamily,
    fontSize: '16px',
    lineHeight: '26px',
  };

  const btnContainer = {
    textAlign: 'center' as const,
  };

  const button = {
    fontFamily,
    backgroundColor: '#007BFF',
    borderRadius: '3px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
  };

  const hr = {
    borderColor: '#cccccc',
    margin: '20px 0',
  };

  const footer = {
    fontFamily,
    color: '#8898aa',
    fontSize: '12px',
    fontWeight: 'bold',
  };
</script>

<Html lang="en">
  <Head />
  <Preview preview="Forgot Password Request" />
  <Section style={main}>
    <Container style={container}>
      <Text style={paragraph}>
        Você pediu para redefinir a senha da sua conta no Cuepoint.
      </Text>
      <Text style={paragraph}>Clique no botão abaixo para redefinir sua senha:</Text>
      <Section style={btnContainer}>
        <Button
          pX={12}
          pY={12}
          style={button}
          href={`${process.env.APP_HOST_EMAIL}auth/reset-password/${id}`}
        >
          Redefinir senha
        </Button>
      </Section>
      <Text style={paragraph}>Se você não fez este pedido, ignore este e-mail.</Text>

      <Hr style={hr} />
      <Text style={footer}>Atenciosamente,</Text>
      <Text style={footer}>Equipe Cuepoint</Text>
    </Container>
  </Section>
</Html>
