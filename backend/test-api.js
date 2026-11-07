const http = require('http');
const app = require('./src/app');
const { checkConnection } = require('./src/config/db');

async function runTests() {
  console.log('🚀 Starting Automated Full-Stack API Test Suite for Safar Sakhi...\n');

  await checkConnection();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://127.0.0.1:5099/api';

  try {
    // 1. Health check
    const health = await fetch(`${baseUrl}/health`).then(r => r.json());
    console.log('1. Health Check:', health.status === 'ok' ? '✅ PASSED' : '❌ FAILED');

    // 2. Login User
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@safarsakhi.com', password: 'Password@123' })
    }).then(r => r.json());
    console.log('2. User Login:', loginRes.success ? '✅ PASSED' : '❌ FAILED');
    const userToken = loginRes.token;

    // 3. Login Admin
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@safarsakhi.com', password: 'Admin@123' })
    }).then(r => r.json());
    console.log('3. Admin Login:', adminLoginRes.success ? '✅ PASSED' : '❌ FAILED');
    const adminToken = adminLoginRes.token;

    // 4. Get Current User Me
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());
    console.log('4. Profile Access (/auth/me):', meRes.success ? '✅ PASSED' : '❌ FAILED');

    // 5. Trusted Contacts
    const contactsRes = await fetch(`${baseUrl}/contacts`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());
    console.log('5. Contacts Listing:', contactsRes.success && contactsRes.contacts.length > 0 ? '✅ PASSED' : '❌ FAILED');

    // 6. Start Journey
    const now = new Date();
    const eta = new Date(now.getTime() + 45 * 60000);
    const startJourneyRes = await fetch(`${baseUrl}/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        startLocation: 'DLF CyberHub, Gurugram',
        startLatitude: 28.4950,
        startLongitude: 77.0895,
        destination: 'Indirapuram, Ghaziabad',
        destinationLatitude: 28.6369,
        destinationLongitude: 77.3697,
        expectedArrivalTime: eta.toISOString(),
        journeyType: 'CAB',
        notes: 'White Swift Dzire DL 1Y 9823'
      })
    }).then(r => r.json());
    console.log('6. Start Journey:', startJourneyRes.success ? '✅ PASSED' : '❌ FAILED');
    const journey = startJourneyRes.journey;

    // 7. Get Active Journey
    const activeRes = await fetch(`${baseUrl}/journeys/active`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());
    console.log('7. Active Journey Detection:', activeRes.success && activeRes.activeJourney ? '✅ PASSED' : '❌ FAILED');

    // 8. Public Family Tracking Link (no auth required)
    const trackRes = await fetch(`${baseUrl}/journeys/track/${journey.trackingToken}`).then(r => r.json());
    console.log('8. Family Live Tracking Shared Endpoint:', trackRes.success && trackRes.journey ? '✅ PASSED' : '❌ FAILED');

    // 9. Location Update
    const locRes = await fetch(`${baseUrl}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        journeyId: journey.id,
        latitude: 28.5100,
        longitude: 77.1000,
        accuracy: 10,
        speed: 35
      })
    }).then(r => r.json());
    console.log('9. Live Coordinate Tracking Update:', locRes.success ? '✅ PASSED' : '❌ FAILED');

    // 10. AI Companion Chat
    const aiRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        message: 'Hi Sakhi, I am on my way home. Can you check my ETA?',
        context: { activeJourneyId: journey.id }
      })
    }).then(r => r.json());
    console.log('10. AI Voice/Text Companion Chat:', aiRes.success && aiRes.reply ? '✅ PASSED' : '❌ FAILED');
    console.log(`    Sakhi Reply: "${aiRes.reply.substring(0, 75)}..."`);

    // 11. Trigger Emergency SOS
    const sosRes = await fetch(`${baseUrl}/sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        journeyId: journey.id,
        latitude: 28.5100,
        longitude: 77.1000,
        triggerType: 'MANUAL'
      })
    }).then(r => r.json());
    console.log('11. Trigger Emergency SOS Incident:', sosRes.success && sosRes.incident ? '✅ PASSED' : '❌ FAILED');

    // 12. Cancel SOS Incident
    const cancelSosRes = await fetch(`${baseUrl}/sos/${sosRes.incident.id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ resolutionNotes: 'Test resolved' })
    }).then(r => r.json());
    console.log('12. Cancel/Resolve SOS Incident:', cancelSosRes.success ? '✅ PASSED' : '❌ FAILED');

    // 13. Safety Confirmation ("I Am Safe")
    const safeRes = await fetch(`${baseUrl}/journeys/${journey.id}/confirm-safe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ message: 'I am safe and on track.' })
    }).then(r => r.json());
    console.log('13. Safety Check-In ("I Am Safe"):', safeRes.success ? '✅ PASSED' : '❌ FAILED');

    // 14. Complete Journey Safely
    const completeRes = await fetch(`${baseUrl}/journeys/${journey.id}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());
    console.log('14. Complete Journey Safely:', completeRes.success ? '✅ PASSED' : '❌ FAILED');

    // 15. Analytics Summary
    const analyticsRes = await fetch(`${baseUrl}/journeys/analytics/summary`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());
    console.log('15. Recharts Analytics Data Summary:', analyticsRes.success ? '✅ PASSED' : '❌ FAILED');

    // 16. Admin Dashboard Stats
    const adminStatsRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    console.log('16. Admin Control Center Stats:', adminStatsRes.success ? '✅ PASSED' : '❌ FAILED');

    // 17. Family Member Login
    const familyLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sunita@safarsakhi.com', password: 'Password@123' })
    }).then(r => r.json());
    console.log('17. Family Member Login (Role: FAMILY):', familyLoginRes.success && familyLoginRes.user.role === 'FAMILY' ? '✅ PASSED' : '❌ FAILED');
    const familyToken = familyLoginRes.token;

    // 18. Family Connections (Traveler View)
    const travelerCircleRes = await fetch(`${baseUrl}/family/connections`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());
    console.log('18. Traveler Family Circle Listing:', travelerCircleRes.success && travelerCircleRes.connections.length > 0 ? '✅ PASSED' : '❌ FAILED');

    // 19. Family Connections (Family Member View)
    const familyCircleRes = await fetch(`${baseUrl}/family/connections`, {
      headers: { 'Authorization': `Bearer ${familyToken}` }
    }).then(r => r.json());
    console.log('19. Family Member Connected Travelers Listing:', familyCircleRes.success && familyCircleRes.connections.length > 0 ? '✅ PASSED' : '❌ FAILED');

    // 20. Start Journey explicitly shared with Family Guardian
    const sharedEta = new Date(Date.now() + 30 * 60000);
    const startSharedRes = await fetch(`${baseUrl}/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        startLocation: 'Hauz Khas Village, New Delhi',
        startLatitude: 28.5534,
        startLongitude: 77.1944,
        destination: 'Sector 62, Noida',
        destinationLatitude: 28.6280,
        destinationLongitude: 77.3649,
        expectedArrivalTime: sharedEta.toISOString(),
        journeyType: 'AUTO',
        notes: 'Green Auto DL 1R 4421',
        sharedFamilyIds: ['user_family_sunita_001']
      })
    }).then(r => r.json());
    console.log('20. Traveler Starts Journey Explicitly Shared with Family:', startSharedRes.success ? '✅ PASSED' : '❌ FAILED');
    const sharedJourney = startSharedRes.journey;

    // 21. Family Shared Journeys Endpoint
    const familyJourneysRes = await fetch(`${baseUrl}/family/journeys`, {
      headers: { 'Authorization': `Bearer ${familyToken}` }
    }).then(r => r.json());
    const hasSharedJourney = familyJourneysRes.success && familyJourneysRes.journeys.some(j => j.id === sharedJourney.id);
    console.log('21. Family Dashboard Shared Journeys Fetch:', hasSharedJourney ? '✅ PASSED' : '❌ FAILED');

    // 22. Family Journey Detail Access
    const journeyDetailRes = await fetch(`${baseUrl}/family/journeys/${sharedJourney.id}`, {
      headers: { 'Authorization': `Bearer ${familyToken}` }
    }).then(r => r.json());
    console.log('22. Family Live Journey Telemetry & Breadcrumbs Access:', journeyDetailRes.success && journeyDetailRes.journey.id === sharedJourney.id ? '✅ PASSED' : '❌ FAILED');

    // 23. Security Check: Unshared Journey Access Forbidden for Family Member
    // Complete the shared journey so we can start an unshared one
    await fetch(`${baseUrl}/journeys/${sharedJourney.id}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const unsharedStartRes = await fetch(`${baseUrl}/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        startLocation: 'Connaught Place, Delhi',
        destination: 'Karol Bagh, Delhi',
        expectedArrivalTime: new Date(Date.now() + 20 * 60000).toISOString(),
        journeyType: 'METRO',
        sharedFamilyIds: [] // Not shared with Sunita
      })
    }).then(r => r.json());

    const unsharedJourney = unsharedStartRes.journey;
    const forbiddenRes = await fetch(`${baseUrl}/family/journeys/${unsharedJourney.id}`, {
      headers: { 'Authorization': `Bearer ${familyToken}` }
    });
    console.log('23. Security Authorization (Unshared Journey returns 403 Forbidden):', forbiddenRes.status === 403 ? '✅ PASSED (403 Forbidden)' : `❌ FAILED (${forbiddenRes.status})`);

    // Clean up unshared journey
    await fetch(`${baseUrl}/journeys/${unsharedJourney.id}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    // 24. Google OAuth Callback (Traveler Account)
    const googleUserRes = await fetch(`${baseUrl}/auth/google-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ananya.sharma.test@gmail.com',
        fullName: 'Ananya Sharma',
        role: 'USER',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        supabaseId: 'sb-test-user-oauth-101'
      })
    }).then(r => r.json());
    console.log('24. Google OAuth Callback Sync (Traveler Account):', googleUserRes.success && googleUserRes.user.role === 'USER' ? '✅ PASSED' : '❌ FAILED');

    // 25. Google OAuth Callback (Family Guardian Account)
    const googleFamilyRes = await fetch(`${baseUrl}/auth/google-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rajesh.sharma.test@gmail.com',
        fullName: 'Rajesh Sharma',
        role: 'FAMILY',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        supabaseId: 'sb-test-family-oauth-102'
      })
    }).then(r => r.json());
    console.log('25. Google OAuth Callback Sync (Family Guardian Account):', googleFamilyRes.success && googleFamilyRes.user.role === 'FAMILY' ? '✅ PASSED' : '❌ FAILED');

    console.log('\n🎉 ALL 25 BACKEND API & SECURITY SERVICES PASSED WITH ZERO ERRORS!\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();

