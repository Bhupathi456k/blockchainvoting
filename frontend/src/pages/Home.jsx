import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, LockKeyhole, Zap, BadgeCheck, ArrowRight, Shield } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';

const Home = () => {
  const features = [
    {
      icon: ShieldCheck,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-950/40 border-indigo-800/50',
      title: 'Blockchain Security',
      description: 'All votes are immutably recorded on the Ethereum blockchain ensuring complete tamper-resistance.',
    },
    {
      icon: LockKeyhole,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-950/40 border-emerald-800/50',
      title: 'Duplicate Prevention',
      description: 'Smart contracts cryptographically enforce one-vote-per-voter integrity at the protocol layer.',
    },
    {
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-950/40 border-amber-800/50',
      title: 'Real-time Results',
      description: 'Live vote tabulations computed deterministically directly from smart contract state.',
    },
    {
      icon: BadgeCheck,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-950/40 border-cyan-800/50',
      title: 'Verifiable Transactions',
      description: 'Every ballot cast produces a cryptographic receipt verifiable on the public ledger.',
    },
  ];

  return (
    <div className="py-8 md:py-16">
      <Container size="lg">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center pt-6 pb-16 md:pt-12 md:pb-24">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-6 shadow-inner">
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            <span>Secure Digital Voting</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Secure voting.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Verified by blockchain.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
            A secure and transparent electronic voting platform powered by Ethereum smart contracts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40 text-white font-semibold" rightIcon={ArrowRight}>
                Enter Dashboard
              </Button>
            </Link>
            <Link to="/elections" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 hover:bg-slate-800 text-slate-200">
                Explore Elections
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-slate-400 hover:text-white">
                Register as Voter
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Section */}
        <div className="pt-8 pb-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
              Enterprise-grade Election Integrity
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Designed with decentralized architecture to eliminate single points of failure and ensure trustless consensus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  hover
                  className="p-6 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-5 border ${feature.iconBg}`}>
                      <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Home;
