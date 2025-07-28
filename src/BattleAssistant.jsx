import React, { useState } from 'react';

// 怪物状态枚举
const STATUS_OPTIONS = ['正常', '濒死', '眩晕', '中毒', '隐身'];

function getDefaultMonster() {
  return { name: '', hp: 10, status: ['正常'], initiativeBonus: 0, images: [] };
}
function getDefaultPlayer() {
  return { name: '', initiative: 10 };
}

function BattleAssistant() {
  // 战斗设置弹窗相关状态
  const [showSetup, setShowSetup] = useState(true);
  const [monsterInputs, setMonsterInputs] = useState([{ ...getDefaultMonster() }]);
  const [playerInputs, setPlayerInputs] = useState([{ ...getDefaultPlayer() }]);
  const [combatants, setCombatants] = useState([]);
  // 在组件顶部state中添加批量怪物输入相关状态
  const [batchMonster, setBatchMonster] = useState({ name: '', hp: 10, initiativeBonus: 0, count: 1 });
  // 在组件顶部state中增加currentTurn
  const [currentTurn, setCurrentTurn] = useState(0);
  // 在组件顶部state中增加批量图片状态
  const [batchMonsterImages, setBatchMonsterImages] = useState([]);

  // 怪物图片管理
  // 移除全局monsterImages和imageDropRef

  // 添加怪物/玩家输入行
  const addMonsterInput = () => setMonsterInputs(inputs => [...inputs, { ...getDefaultMonster() }]);
  const addPlayerInput = () => setPlayerInputs(inputs => [...inputs, { ...getDefaultPlayer() }]);

  // 批量添加怪物函数，图片赋值
  const batchAddMonsters = () => {
    if (!batchMonster.name || batchMonster.count < 1) return;
    setMonsterInputs(inputs => [
      ...inputs,
      ...Array.from({ length: batchMonster.count }, (_, i) => ({
        name: batchMonster.count > 1 ? `${batchMonster.name}${i + 1}` : batchMonster.name,
        hp: batchMonster.hp,
        status: ['正常'],
        initiativeBonus: batchMonster.initiativeBonus,
        images: [...batchMonsterImages],
      }))
    ]);
    setBatchMonster({ name: '', hp: 10, initiativeBonus: 0, count: 1 });
    setBatchMonsterImages([]);
  };

  // 修改输入内容
  const updateMonsterInput = (idx, field, value) => {
    setMonsterInputs(inputs => inputs.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };
  const updatePlayerInput = (idx, field, value) => {
    setPlayerInputs(inputs => inputs.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // 怪物状态文本输入
  const updateMonsterStatusText = (id, value) => {
    setCombatants(list =>
      list.map(c =>
        c.id === id && c.type === 'monster'
          ? { ...c, statusText: value }
          : c
      )
    );
  };

  // 怪物死亡
  const killMonster = (id) => {
    setCombatants(list =>
      list.map(c =>
        c.id === id && c.type === 'monster'
          ? { ...c, dead: true }
          : c
      )
    );
  };

  // 开始战斗，生成战斗参与者
  // roll 1d20
  function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }

  const startBattle = () => {
    let id = 1;
    const monsters = monsterInputs
      .filter(m => m.name)
      .map(m => {
        const roll = rollD20();
        const initiative = roll + Number(m.initiativeBonus);
        return {
          id: id++,
          name: m.name,
          hp: Number(m.hp),
          maxHp: Number(m.hp),
          status: ['正常'],
          initiative,
          initiativeRoll: `${roll} + ${m.initiativeBonus} = ${initiative}`,
          type: 'monster',
          images: m.images || [],
        };
      });
    const players = playerInputs
      .filter(p => p.name)
      .map(p => ({ ...p, id: id++, type: 'player', status: [], hp: undefined, maxHp: undefined, initiative: Number(p.initiative) }));
    setCombatants([...monsters, ...players]);
    setShowSetup(false);
    setCurrentTurn(0);
  };

  // 按先攻排序
  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);

  // 回合切换函数（自动跳过死亡怪物）
  const nextTurn = () => {
    let next = currentTurn;
    const len = sortedCombatants.length;
    if (len === 0) return;
    do {
      next = (next + 1) % len;
    } while (sortedCombatants[next]?.type === 'monster' && sortedCombatants[next]?.dead && next !== currentTurn);
    setCurrentTurn(next);
  };

  // 怪物血量调整
  const changeHp = (id, delta) => {
    setCombatants(list =>
      list.map(c =>
        c.id === id && c.type === 'monster'
          ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) }
          : c
      )
    );
  };

  // 粘贴/拖拽图片到指定怪物输入行
  function handleMonsterImagePaste(idx, e) {
    if (!e.clipboardData) return;
    const items = Array.from(e.clipboardData.items);
    items.forEach(item => {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        const url = URL.createObjectURL(file);
        setMonsterInputs(inputs => inputs.map((m, i) => i === idx ? { ...m, images: [...(m.images || []), url] } : m));
      }
    });
    e.preventDefault();
  }
  function handleMonsterImageDrop(idx, e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setMonsterInputs(inputs => inputs.map((m, i) => i === idx ? { ...m, images: [...(m.images || []), url] } : m));
      }
    });
  }
  function handleMonsterImageDragOver(e) {
    e.preventDefault();
  }

  // 批量添加区图片粘贴/拖拽
  function handleBatchMonsterImagePaste(e) {
    if (!e.clipboardData) return;
    const items = Array.from(e.clipboardData.items);
    items.forEach(item => {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        const url = URL.createObjectURL(file);
        setBatchMonsterImages(imgs => [...imgs, url]);
      }
    });
    e.preventDefault();
  }
  function handleBatchMonsterImageDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setBatchMonsterImages(imgs => [...imgs, url]);
      }
    });
  }
  function handleBatchMonsterImageDragOver(e) {
    e.preventDefault();
  }

  // 血量设置
  const setMonsterHp = (id, value) => {
    setCombatants(list =>
      list.map(c =>
        c.id === id && c.type === 'monster'
          ? { ...c, hp: Math.max(0, Math.min(c.maxHp, Number(value))) }
          : c
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-4 px-1">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-2 text-blue-700 dark:text-blue-300 drop-shadow">DND 5e 战斗助手</h2>
      <p className="text-center text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">快速设置怪物和玩家，自动生成先攻顺序，实时管理血量与状态。</p>
      {showSetup ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-4xl mx-auto mb-6 border border-blue-100 dark:border-gray-700">
          <h3 className="text-2xl font-bold mb-6 text-blue-500 dark:text-blue-300">战斗设置</h3>
          <div className="mb-8">
            <h4 className="font-bold mb-3 text-gray-700 dark:text-gray-200">怪物列表</h4>
            {/* 在怪物输入区上方增加批量添加区和说明 */}
            <div className="flex flex-col items-start gap-2">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">怪物名称</label>
                  <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-32 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" placeholder="如 哥布林" value={batchMonster.name} onChange={e => setBatchMonster(b => ({ ...b, name: e.target.value }))} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">血量（最大HP）</label>
                  <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-20 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" min={1} value={batchMonster.hp} onChange={e => setBatchMonster(b => ({ ...b, hp: Number(e.target.value) }))} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">先攻加值</label>
                  <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-20 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" value={batchMonster.initiativeBonus} onChange={e => setBatchMonster(b => ({ ...b, initiativeBonus: Number(e.target.value) }))} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">数量</label>
                  <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-16 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" min={1} value={batchMonster.count} onChange={e => setBatchMonster(b => ({ ...b, count: Number(e.target.value) }))} />
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold shadow transition" onClick={batchAddMonsters}>批量添加怪物</button>
                <span className="text-xs text-gray-500 ml-2">如输入“哥布林”+3，自动添加“哥布林1、哥布林2、哥布林3”</span>
              </div>
              <div
                className="mt-2 min-h-[60px] bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-blue-200 dark:border-blue-600 rounded-lg flex flex-col gap-2 items-start justify-start p-2 w-full"
                onPaste={handleBatchMonsterImagePaste}
                onDrop={handleBatchMonsterImageDrop}
                onDragOver={handleBatchMonsterImageDragOver}
                tabIndex={0}
              >
                {batchMonsterImages.length === 0 ? (
                  <span className="text-xs text-gray-400">可粘贴或拖拽图片到此，所有新怪物将批量带图</span>
                ) : (
                  batchMonsterImages.map((url, i) => (
                    <div key={i} className="w-20 h-20 mb-1 rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <img src={url} alt="怪物" className="object-contain w-full h-full" />
                    </div>
                  ))
                )}
              </div>
            </div>
            {monsterInputs.map((m, idx) => (
              <div key={idx} className="flex flex-col gap-1 mb-4">
                <div className="flex gap-3 items-end">
                  <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-40 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" placeholder="怪物名称" value={m.name} onChange={e => updateMonsterInput(idx, 'name', e.target.value)} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-24 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" placeholder="血量" value={m.hp} min={1} onChange={e => updateMonsterInput(idx, 'hp', Number(e.target.value))} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-28 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" placeholder="先攻加值" value={m.initiativeBonus} onChange={e => updateMonsterInput(idx, 'initiativeBonus', e.target.value)} />
                  <span className="text-xs text-gray-400">单独编辑可覆盖批量添加内容</span>
                </div>
                <div
                  className="mt-1 mb-2 min-h-[60px] bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-blue-200 dark:border-blue-600 rounded-lg flex flex-col gap-2 items-start justify-start p-2"
                  onPaste={e => handleMonsterImagePaste(idx, e)}
                  onDrop={e => handleMonsterImageDrop(idx, e)}
                  onDragOver={handleMonsterImageDragOver}
                  tabIndex={0}
                >
                  {m.images && m.images.length === 0 ? (
                    <span className="text-xs text-gray-400">可粘贴或拖拽图片到此，支持多图，竖向展示</span>
                  ) : (
                    m.images.map((url, i) => (
                      <div key={i} className="w-20 h-20 mb-1 rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <img src={url} alt="怪物" className="object-contain w-full h-full" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
            <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 mt-2 shadow transition font-semibold" onClick={addMonsterInput}>添加怪物</button>
          </div>
          <div className="mb-8">
            <h4 className="font-bold mb-3 text-gray-700 dark:text-gray-200">玩家列表</h4>
            {playerInputs.map((p, idx) => (
              <div key={idx} className="flex gap-3 mb-2">
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-40 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-300 outline-none transition" placeholder="玩家名称" value={p.name} onChange={e => updatePlayerInput(idx, 'name', e.target.value)} />
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-28 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-300 outline-none transition" type="number" placeholder="先攻" value={p.initiative} onChange={e => updatePlayerInput(idx, 'initiative', Number(e.target.value))} />
              </div>
            ))}
            <button className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 mt-2 shadow transition font-semibold" onClick={addPlayerInput}>添加玩家</button>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl px-6 py-3 mt-4 w-full shadow-lg text-lg transition" onClick={startBattle}>开始战斗</button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-3 items-start w-full max-w-[99vw] mx-auto">
          {/* 左侧表格 - 移除最小宽度限制 */}
          <div className="w-full md:w-[68%] overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-900 rounded-xl shadow border border-blue-100 dark:border-gray-700 text-sm">
              <thead>
                <tr className="bg-blue-100 dark:bg-gray-700">
                  <th className="py-2 px-2 text-left font-bold">先攻</th>
                  <th className="py-2 px-2 text-left font-bold">名称</th>
                  <th className="py-2 px-2 text-left font-bold">类型</th>
                  <th className="py-2 px-2 text-left font-bold">血量</th>
                  <th className="py-2 px-2 text-left font-bold">先攻结果</th>
                  <th className="py-2 px-2 text-left font-bold">状态</th>
                  <th className="py-2 px-2 text-left font-bold">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedCombatants.map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 transition ${i === currentTurn ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}> 
                    <td className="py-2 px-4 font-bold text-blue-700 dark:text-blue-300 text-lg">{c.initiative}</td>
                    <td className="py-2 px-4 text-base">{c.name}</td>
                    <td className="py-2 px-4 text-base">{c.type === 'monster' ? '怪物' : '玩家'}</td>
                    <td className="py-2 px-4">
                    {c.type === 'monster' ? (
                      <div className={`flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm ${c.dead ? 'opacity-60 grayscale' : ''}`}> 
                        <button className="bg-red-500 hover:bg-red-600 text-white rounded-full px-2 py-1 shadow transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-400" onClick={() => changeHp(c.id, -1)}>
                          <span className="font-bold text-lg">-</span>
                        </button>
                        <input
                          className="border-none bg-transparent text-center text-base font-mono w-12 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded hide-spin"
                          type="number"
                          min={0}
                          max={c.maxHp}
                          value={c.hp}
                          onChange={e => setMonsterHp(c.id, e.target.value)}
                          disabled={c.dead}
                          style={{ MozAppearance: 'textfield', appearance: 'textfield' }}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">/ {c.maxHp}</span>
                        <button className="bg-green-500 hover:bg-green-600 text-white rounded-full px-2 py-1 shadow transition duration-150 focus:outline-none focus:ring-2 focus:ring-green-400" onClick={() => changeHp(c.id, 1)} disabled={c.dead}>
                          <span className="font-bold text-lg">+</span>
                        </button>
                      </div>
                    ) : <span className="text-gray-400">--</span>}
                  </td>
                    <td className="py-2 px-4">
                    {c.type === 'monster' ? (
                      <span className="text-purple-700 dark:text-purple-300 font-mono">{c.initiativeRoll}</span>
                    ) : (
                      <span className="text-gray-700 dark:text-gray-200 font-mono">{c.initiative}</span>
                    )}
                  </td>
                    <td className="py-2 px-4">
                      {c.type === 'monster' ? (
                        <input
                          className="border rounded px-2 py-1 w-32 text-xs bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          type="text"
                          placeholder="状态描述"
                          value={c.statusText || ''}
                          onChange={e => updateMonsterStatusText(c.id, e.target.value)}
                          disabled={c.dead}
                        />
                      ) : <span className="text-gray-400">--</span>}
                  </td>
                    <td className="py-2 px-4">
                      {c.type === 'monster' ? (
                        c.dead ? (
                          <span className="text-red-600 font-bold text-xs">已死亡</span>
                        ) : (
                          <button
                            className="bg-gray-700 hover:bg-gray-900 text-white rounded px-3 py-1 text-xs"
                            onClick={() => killMonster(c.id)}
                          >死亡</button>
                        )
                      ) : null}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
            {/* 当前回合信息和回合切换按钮 */}
            <div className="mt-4 flex flex-col items-center">
              <div className="mb-1 text-base font-bold text-blue-700 dark:text-blue-300">
                当前回合：{sortedCombatants[currentTurn]?.name}（{sortedCombatants[currentTurn]?.type === 'monster' ? '怪物' : '玩家'}）
              </div>
              <button className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 font-semibold shadow transition text-sm" onClick={nextTurn}>下个回合</button>
            </div>
          </div>
          {/* 右侧怪物图片 - 调整宽度 */}
          <div className="w-full md:w-[30%] min-h-[220px] flex flex-col items-center bg-white dark:bg-gray-900 rounded-xl shadow p-2 border border-blue-100 dark:border-gray-700">
            <div className="mb-1 text-base font-bold text-blue-700 dark:text-blue-300">当前怪物图片</div>
            {sortedCombatants[currentTurn]?.type === 'monster' && sortedCombatants[currentTurn]?.images?.length > 0 ? (
              <div className="flex flex-col gap-3 items-center w-full">
                {sortedCombatants[currentTurn].images.map((url, i) => (
                  <div key={i} className="w-full max-w-[200px] h-40 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img src={url} alt="怪物" className="object-contain w-full h-full" />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400 mt-4">无图片</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BattleAssistant;
