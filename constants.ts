
import { Course, CourseCategory, CourseLevel, Instructor } from './types';

export const WHATSAPP_NUMBER = '556792001722';

export const createWhatsAppLink = (message: string = '') => {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
};

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'inst1',
    name: 'Dra. Ana Souza',
    role: 'Neurocientista Cognitiva',
    avatar: 'https://picsum.photos/id/64/100/100',
    bio: 'Doutora em Neurociências pela USP, com foco em plasticidade cerebral e processos de aprendizagem. Atua há 15 anos formando educadores.'
  },
  {
    id: 'inst2',
    name: 'Prof. Carlos Mendes',
    role: 'Doutor em Educação',
    avatar: 'https://picsum.photos/id/91/100/100',
    bio: 'Pesquisador de metodologias ativas e gamificação. Autor de 3 livros sobre gestão de sala de aula e engajamento estudantil.'
  },
  {
    id: 'inst3',
    name: 'Mariana Lima',
    role: 'Especialista em Inclusão',
    avatar: 'https://picsum.photos/id/177/100/100',
    bio: 'Pedagoga com especialização em Educação Especial e Psicopedagogia. Consultora de escolas para implementação do PEI.'
  }
];

export const COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Neurociência da Aprendizagem',
    description: 'Entenda como o cérebro aprende e maximize seus métodos de ensino.',
    fullDescription: 'Este curso aprofunda os mecanismos biológicos da memória, atenção e plasticidade cerebral, traduzindo conceitos complexos em práticas pedagógicas aplicáveis em sala de aula. Ideal para professores que desejam fundamentar suas práticas na ciência.',
    price: 299.90,
    thumbnail: 'https://picsum.photos/id/20/800/600',
    level: CourseLevel.Iniciante,
    category: CourseCategory.Neurociencia,
    duration: '40h',
    modules: 4,
    rating: 4.9,
    students: 1250,
    instructor: INSTRUCTORS[0],
    syllabus: [
      {
        title: 'Introdução ao Cérebro Aprendiz',
        lessons: [
          { title: 'Neuromitos na Educação', duration: '25 min' },
          { title: 'Estruturas cerebrais básicas', duration: '40 min' },
          { title: 'Como a informação vira memória', duration: '35 min' }
        ]
      },
      {
        title: 'Atenção e Funções Executivas',
        lessons: [
          { title: 'Tipos de atenção e como captá-la', duration: '30 min' },
          { title: 'Desenvolvendo o controle inibitório', duration: '45 min' },
          { title: 'Estratégias para alunos com TDAH', duration: '50 min' }
        ]
      },
      {
        title: 'Emoção e Cognição',
        lessons: [
          { title: 'O papel da amígdala no aprendizado', duration: '30 min' },
          { title: 'Ambiente emocional seguro', duration: '20 min' },
          { title: 'Estresse tóxico vs. Desafio positivo', duration: '40 min' }
        ]
      },
      {
        title: 'Neuroplasticidade na Prática',
        lessons: [
          { title: 'O cérebro muda o tempo todo', duration: '35 min' },
          { title: 'Growth Mindset (Mentalidade de Crescimento)', duration: '40 min' },
          { title: 'Avaliação final e Projeto Prático', duration: '60 min' }
        ]
      }
    ]
  },
  {
    id: 'c2',
    title: 'Gestão de Sala de Aula Positiva',
    description: 'Técnicas baseadas em evidências para criar um ambiente acolhedor.',
    fullDescription: 'Aprenda estratégias de liderança e gestão emocional para lidar com conflitos e promover um ambiente de respeito mútuo e foco no aprendizado.',
    price: 159.90,
    thumbnail: 'https://picsum.photos/id/180/800/600',
    level: CourseLevel.Intermediario,
    category: CourseCategory.Pedagogia,
    duration: '20h',
    modules: 3,
    rating: 4.7,
    students: 890,
    instructor: INSTRUCTORS[1],
    syllabus: [
      {
        title: 'Fundamentos da Disciplina Positiva',
        lessons: [
          { title: 'Gentileza e Firmeza', duration: '30 min' },
          { title: 'Conexão antes da correção', duration: '25 min' }
        ]
      },
      {
        title: 'Resolução de Conflitos',
        lessons: [
          { title: 'Mediação de brigas entre alunos', duration: '40 min' },
          { title: 'Reuniões de classe eficazes', duration: '45 min' }
        ]
      },
      {
        title: 'Comunicação Não-Violenta (CNV)',
        lessons: [
          { title: 'Os 4 passos da CNV', duration: '50 min' },
          { title: 'Feedback construtivo', duration: '30 min' }
        ]
      }
    ]
  },
  {
    id: 'c3',
    title: 'Autismo e Inclusão Escolar',
    description: 'Estratégias práticas para inclusão de alunos no espectro autista.',
    fullDescription: 'Um guia completo sobre o TEA no contexto escolar, abordando adaptação curricular, PEI (Plano de Ensino Individualizado) e tecnologias assistivas.',
    price: 349.00,
    thumbnail: 'https://picsum.photos/id/201/800/600',
    level: CourseLevel.Avancado,
    category: CourseCategory.Inclusao,
    duration: '60h',
    modules: 5,
    rating: 5.0,
    students: 2100,
    instructor: INSTRUCTORS[2],
    syllabus: [
      {
        title: 'Compreendendo o Espectro',
        lessons: [
          { title: 'O que é o TEA hoje?', duration: '40 min' },
          { title: 'Hiperfoco e sensibilidade sensorial', duration: '35 min' }
        ]
      },
      {
        title: 'Adaptação Curricular',
        lessons: [
          { title: 'Quando e como adaptar atividades', duration: '50 min' },
          { title: 'Avaliação diferenciada', duration: '40 min' }
        ]
      },
      {
        title: 'O Plano de Ensino Individualizado (PEI)',
        lessons: [
          { title: 'Estrutura legal do PEI', duration: '30 min' },
          { title: 'Montando um PEI passo a passo', duration: '60 min' }
        ]
      },
      {
        title: 'Manejo de Comportamentos Desafiadores',
        lessons: [
          { title: 'Análise funcional do comportamento', duration: '45 min' },
          { title: 'Estratégias de regulação', duration: '40 min' }
        ]
      },
      {
        title: 'Parceria Família-Escola',
        lessons: [
          { title: 'Acolhimento da família', duration: '30 min' },
          { title: 'Comunicação diária', duration: '25 min' }
        ]
      }
    ]
  },
  {
    id: 'c4',
    title: 'Neuroplasticidade e Reabilitação',
    description: 'Como o cérebro se adapta e recupera funções.',
    fullDescription: 'Explore os limites da plasticidade cerebral e como educadores podem auxiliar no desenvolvimento cognitivo de crianças com dificuldades de aprendizagem.',
    price: 279.90,
    thumbnail: 'https://picsum.photos/id/96/800/600',
    level: CourseLevel.Avancado,
    category: CourseCategory.Neurociencia,
    duration: '45h',
    modules: 4,
    rating: 4.8,
    students: 540,
    instructor: INSTRUCTORS[0],
    syllabus: [
      {
        title: 'Bases da Neuroplasticidade',
        lessons: [
          { title: 'Sinaptogênese e Poda Neural', duration: '40 min' },
          { title: 'Períodos Críticos vs. Sensíveis', duration: '35 min' }
        ]
      },
      {
        title: 'Aprendizagem e Reabilitação',
        lessons: [
          { title: 'Intervenção Precoce', duration: '45 min' },
          { title: 'Repetição e Intensidade', duration: '30 min' }
        ]
      },
      {
        title: 'Estudos de Caso',
        lessons: [
          { title: 'Recuperação pós-lesão', duration: '50 min' },
          { title: 'Dislexia e intervenção fonológica', duration: '45 min' }
        ]
      },
      {
        title: 'Ferramentas Práticas',
        lessons: [
          { title: 'Jogos cognitivos', duration: '30 min' },
          { title: 'Softwares de reabilitação', duration: '35 min' }
        ]
      }
    ]
  },
  {
    id: 'c5',
    title: 'Gamificação na Educação',
    description: 'Engaje seus alunos utilizando mecânicas de jogos.',
    fullDescription: 'Transforme suas aulas monótonas em experiências imersivas utilizando pontuação, rankings e narrativas envolventes.',
    price: 199.90,
    thumbnail: 'https://picsum.photos/id/160/800/600',
    level: CourseLevel.Iniciante,
    category: CourseCategory.Pedagogia,
    duration: '25h',
    modules: 3,
    rating: 4.6,
    students: 1500,
    instructor: INSTRUCTORS[1],
    syllabus: [
      {
        title: 'O que é Gamificação?',
        lessons: [
          { title: 'Gamificação vs. Jogos Educativos', duration: '20 min' },
          { title: 'Elementos do Design de Jogos', duration: '30 min' }
        ]
      },
      {
        title: 'Aplicando na Sala de Aula',
        lessons: [
          { title: 'Criando narrativas envolventes', duration: '40 min' },
          { title: 'Sistemas de pontos e badges', duration: '35 min' }
        ]
      },
      {
        title: 'Ferramentas Digitais e Analógicas',
        lessons: [
          { title: 'Kahoot, Quizizz e ClassDojo', duration: '45 min' },
          { title: 'Gamificação "desplugada"', duration: '30 min' }
        ]
      }
    ]
  }
];
