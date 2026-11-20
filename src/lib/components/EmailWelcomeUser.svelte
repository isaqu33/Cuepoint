<script lang="ts">
  import { Button, Container, Head, Hr, Html, Img, Preview, Section, Text } from 'svelte-email';

  export let userPassword = '';

  const fontFamily =
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

  const main = {
    backgroundColor: '#ffffff',
  };

  const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
  };

  const logo = {
    margin: '0 auto',
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

  const header = {
    fontFamily,
    color: '#15171f',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
  };
</script>

<Html lang="en">
  <Head />
  <Preview preview="Bem-vindo ao Cuepoint" />
  <Section style={main}>
    <Container style={container}>
      <Text style={header}>Olá,</Text>

      <Text style={paragraph}>Bem-vindo ao Cuepoint!</Text>
      <Section style={btnContainer}>
        <Button pX={12} pY={12} style={button} href={`${process.env.APP_HOST_EMAIL}auth/login`}>
          Entrar no Cuepoint
        </Button>
      </Section>

      <Hr style={hr} />
      <Text style={footer}>Atenciosamente,</Text>
      <Text style={footer}>Equipe Cuepoint</Text>
    </Container>
  </Section>
</Html>
